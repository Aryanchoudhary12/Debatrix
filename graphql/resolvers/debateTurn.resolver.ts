import { scoreDebateWithGroq } from "@/app/lib/groq";
import { invalidateCache } from "@/app/lib/cache";
import type { GraphQLContext } from "@/types/context";

export const debateTurnResolvers = {
  Mutation: {
    recordDebateTurn: async (
      _parent: unknown,
      args: { debateId: string; content: string; turnIndex: number },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.userId) {
        throw new Error("You must be signed in to record a debate turn.");
      }

      const debate = await ctx.prisma.debate.findUnique({
        where: { id: args.debateId },
      });
      if (!debate) throw new Error("Debate not found");

      const isParticipant =
        debate.CurrentUserId === ctx.userId ||
        debate.OpponentId === ctx.userId;
      if (!isParticipant) {
        throw new Error("Only debate participants can record turns.");
      }

      return ctx.prisma.debateTurn.create({
        data: {
          debateId: args.debateId,
          speakerId: ctx.userId,
          content: args.content,
          turnIndex: args.turnIndex,
        },
      });
    },
    finalizeDebate: async (
      _parent: unknown,
      args: { debateId: string },
      ctx: GraphQLContext,
    ) => {
      const debate = await ctx.prisma.debate.findUnique({
        where: { id: args.debateId },
      });
      if (!debate) throw new Error("Debate not found");

      if (debate.status === "Completed") {
        return debate;
      }

      if (!debate.CurrentUserId || !debate.OpponentId) {
        throw new Error("Debate is missing a participant, cannot finalize.");
      }

      const turns = await ctx.prisma.debateTurn.findMany({
        where: { debateId: args.debateId },
        orderBy: { turnIndex: "asc" },
      });

      if (turns.length === 0) {
        return ctx.prisma.debate.update({
          where: { id: args.debateId },
          data: { status: "Completed" },
        });
      }

      const mappedTurns = turns.map((t) => ({
        speakerLabel:
          t.speakerId === debate.CurrentUserId
            ? ("user1" as const)
            : ("user2" as const),
        content: t.content,
        turnIndex: t.turnIndex,
      }));

      const scores = await scoreDebateWithGroq(debate.title, mappedTurns);
      const applyScore = async (userId: string, score: typeof scores.user1) => {
        const listener = await ctx.prisma.listener.findUnique({
          where: { userId },
        });
        if (!listener) return; 

        await ctx.prisma.stats.upsert({
          where: { listenerId: listener.id },
          create: {
            listenerId: listener.id,
            overallScore: score.overallScore,
            logicScore: score.logicScore,
            persuasionScore: score.persuasionScore,
            factCheckAccuracy: score.factCheckAccuracy,
            aiFeedbackSummary: score.feedbackSummary,
          },
          update: {
            overallScore: score.overallScore,
            logicScore: score.logicScore,
            persuasionScore: score.persuasionScore,
            factCheckAccuracy: score.factCheckAccuracy,
            aiFeedbackSummary: score.feedbackSummary,
          },
        });

        await invalidateCache(`user:${userId}`);
      };

      await applyScore(debate.CurrentUserId, scores.user1);
      await applyScore(debate.OpponentId, scores.user2);

      return ctx.prisma.debate.update({
        where: { id: args.debateId },
        data: { status: "Completed" },
      });
    },
  },
};