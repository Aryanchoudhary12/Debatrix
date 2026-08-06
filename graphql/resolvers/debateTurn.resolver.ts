import { scoreDebateWithGroq } from "@/app/lib/groq";
import { invalidateCache } from "@/app/lib/cache";
import type { GraphQLContext } from "@/types/context";

export const debateTurnResolvers = {
  Mutation: {
    recordDebateTurn: async (
      _parent: unknown,
      args: { debateId: string; content: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.userId) {
        throw new Error("You must be signed in to record a debate turn.");
      }

      const participant = await ctx.prisma.debateParticipant.findUnique({
        where: {
          debateId_userId: { debateId: args.debateId, userId: ctx.userId },
        },
      });
      if (!participant) {
        throw new Error("Only debate participants can record turns.");
      }
      const turn = await ctx.prisma.$transaction(async (tx) => {
        const last = await tx.debateTurn.findFirst({
          where: { debateId: args.debateId },
          orderBy: { turnIndex: "desc" },
          select: { turnIndex: true },
        });
        const nextIndex = (last?.turnIndex ?? -1) + 1;

        return tx.debateTurn.create({
          data: {
            debateId: args.debateId,
            participantId: participant.id,
            content: args.content,
            turnIndex: nextIndex,
          },
        });
      });

      await invalidateCache(`debate:${args.debateId}`);
      return turn;
    },

    finalizeDebate: async (
      _parent: unknown,
      args: { debateId: string },
      ctx: GraphQLContext,
    ) => {
      const debate = await ctx.prisma.debate.findUnique({
        where: { id: args.debateId },
        include: { participants: { include: { user: true } } },
      });
      if (!debate) throw new Error("Debate not found");

      if (debate.status === "Completed") {
        return debate;
      }

      const creator = debate.participants.find((p) => p.role === "Creator");
      const opponent = debate.participants.find((p) => p.role === "Opponent");
      if (!creator || !opponent) {
        throw new Error("Debate is missing a participant, cannot finalize.");
      }

      const turns = await ctx.prisma.debateTurn.findMany({
        where: { debateId: args.debateId },
        orderBy: { turnIndex: "asc" },
      });

      if (turns.length === 0) {
        const updated = await ctx.prisma.debate.update({
          where: { id: args.debateId },
          data: { status: "Completed" },
          include: {
            participants: { include: { user: true } },
          },
        });
        await invalidateCache(`debate:${args.debateId}`);
        return updated;
      }

      const mappedTurns = turns.map((t) => ({
        speakerLabel:
          t.participantId === creator.id
            ? ("user1" as const)
            : ("user2" as const),
        content: t.content,
        turnIndex: t.turnIndex,
      }));

      const scores = await scoreDebateWithGroq(debate.title, mappedTurns);

      const applyScore = async (
        participantId: string,
        userId: string,
        score: typeof scores.user1,
      ) => {
        await ctx.prisma.debateParticipant.update({
          where: { id: participantId },
          data: {
            overallScore: score.overallScore,
            logicScore: score.logicScore,
            persuasionScore: score.persuasionScore,
            factCheckAccuracy: score.factCheckAccuracy,
            feedbackSummary: score.feedbackSummary,
          },
        });

        const listener = await ctx.prisma.listener.findUnique({
          where: { userId },
        });
        if (!listener) return;

        const existing = await ctx.prisma.stats.findUnique({
          where: { listenerId: listener.id },
          select: {
            overallScore: true,
            logicScore: true,
            persuasionScore: true,
            factCheckAccuracy: true,
            debatesPlayed: true,
          },
        });

        const runningAvg = (
          prevAvg: number,
          prevCount: number,
          newValue: number,
        ) => (prevAvg * prevCount + newValue) / (prevCount + 1);

        const prevCount = existing?.debatesPlayed ?? 0;

        await ctx.prisma.stats.upsert({
          where: { listenerId: listener.id },
          create: {
            listenerId: listener.id,
            overallScore: score.overallScore,
            logicScore: score.logicScore,
            persuasionScore: score.persuasionScore,
            factCheckAccuracy: score.factCheckAccuracy,
            aiFeedbackSummary: score.feedbackSummary,
            debatesPlayed: 1,
          },
          update: {
            overallScore: runningAvg(
              existing?.overallScore ?? 0,
              prevCount,
              score.overallScore,
            ),
            logicScore: runningAvg(
              existing?.logicScore ?? 0,
              prevCount,
              score.logicScore,
            ),
            persuasionScore: runningAvg(
              existing?.persuasionScore ?? 0,
              prevCount,
              score.persuasionScore,
            ),
            factCheckAccuracy: runningAvg(
              existing?.factCheckAccuracy ?? 0,
              prevCount,
              score.factCheckAccuracy,
            ),
            aiFeedbackSummary: score.feedbackSummary,
            debatesPlayed: { increment: 1 },
          },
        });

        await invalidateCache(`user:${userId}`);
      };
      await applyScore(creator.id, creator.userId, scores.user1);
      await applyScore(opponent.id, opponent.userId, scores.user2);

      const finalized = await ctx.prisma.debate.update({
        where: { id: args.debateId },
        data: { status: "Completed" },
        include: {
          participants: { include: { user: true } },
        },
      });
      await invalidateCache(`debate:${args.debateId}`);
      return finalized;
    },
  },
};
