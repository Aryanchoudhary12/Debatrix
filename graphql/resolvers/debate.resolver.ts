import { getOrSetCache, invalidateCache } from "@/app/lib/cache";
import type { GraphQLContext } from "../../types/context";
import { emitDebateUpdate } from "@/app/lib/socketEmitter";

export const debateResolvers = {
  Query: {
    getDebateById: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) => {
      const cacheKey = `debate:${args.id}`;
      const result = await getOrSetCache(cacheKey, 60, () => {
        console.log(
          `[getDebateById] cache MISS — hitting DB at ${Date.now()} for ${args.id}`,
        );
        return ctx.prisma.debate.findUnique({
          where: { id: args.id },
          include: {
            participants: { include: { user: true, votesReceived: true } },
            votes: true,
          },
        });
      });
      return result;
    },
    getDebatesByUserId: async (
      _parent: unknown,
      args: { userId: string },
      ctx: GraphQLContext,
    ) => {
      const cacheKey = `debates:byUser:${args.userId}`;
      return getOrSetCache(cacheKey, 60, () =>
        ctx.prisma.debate.findMany({
          where: { participants: { some: { userId: args.userId } } },
          include: {
            participants: {
              include: {
                user: true,
                votesReceived: true,
              },
            },
            votes: true,
          },
        }),
      );
    },
    getOpenDebates: async (
      _parent: unknown,
      _args: unknown,
      ctx: GraphQLContext,
    ) => {
      const cacheKey = `debates:open`;
      return getOrSetCache(cacheKey, 60, () =>
        ctx.prisma.debate.findMany({
          where: { status: "Waiting" },
          include: {
            participants: {
              include: {
                user: true,
                votesReceived: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        }),
      );
    },
  },
  Mutation: {
    createDebate: async (
      _parent: unknown,
      args: { title: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.userId) throw new Error("Not authenticated");

      const newDebate = await ctx.prisma.debate.create({
        data: {
          title: args.title,
          status: "Waiting",
          participants: {
            create: {
              userId: ctx.userId,
              role: "Creator",
            },
          },
        },
        include: { participants: { include: { user: true } } },
      });

      await invalidateCache("debates:open");
      return newDebate;
    },

    joinDebate: async (
      _parent: unknown,
      args: { debateId: string; userId: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.userId) throw new Error("Not authenticated");

      const debate = await ctx.prisma.debate.findUnique({
        where: { id: args.debateId },
        include: { participants: true },
      });
      if (!debate) throw new Error("Debate not found");
      if (debate.status !== "Waiting") {
        throw new Error("This debate is no longer open");
      }

      const creator = debate.participants.find((p) => p.role === "Creator");
      if (!creator) throw new Error("Debate has no creator");
      if (creator.userId === ctx.userId) {
        throw new Error("You cannot join your own debate");
      }
      if (debate.participants.some((p) => p.role === "Opponent")) {
        throw new Error("This debate is no longer open");
      }

      const now = new Date();
      try {
        await ctx.prisma.$transaction([
          ctx.prisma.debateParticipant.create({
            data: {
              debateId: args.debateId,
              userId: ctx.userId,
              role: "Opponent",
            },
          }),
          ctx.prisma.debate.update({
            where: { id: args.debateId },
            data: {
              status: "Live",
              startedAt: now,
              turnStartedAt: now,
              activeUserId: creator.userId,
            },
          }),
        ]);
      } catch {
        throw new Error("This debate is no longer open");
      }
      await Promise.all([
        invalidateCache(`debate:${args.debateId}`),
        invalidateCache(`debates:open`),
      ]);
      emitDebateUpdate(args.debateId, "debate:opponentJoined", {
        opponentUserId: ctx.userId,
        status: "Live",
        turnStartedAt: now.toISOString(),
        activeUserId: creator.userId,
      });
      return ctx.prisma.debate.findUnique({
        where: { id: args.debateId },
        include: { participants: { include: { user: true } } },
      });
    },

    voteOnDebate: async (
      _parent: unknown,
      args: { debateId: string; participantId: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.userId) throw new Error("Not authenticated");

      const participant = await ctx.prisma.debateParticipant.findUnique({
        where: { id: args.participantId },
      });
      if (!participant || participant.debateId !== args.debateId) {
        throw new Error("Invalid participant for this debate");
      }
      const vote = await ctx.prisma.debateVote.upsert({
        where: {
          debateId_voterId: { debateId: args.debateId, voterId: ctx.userId },
        },
        update: { participantId: args.participantId },
        create: {
          debateId: args.debateId,
          voterId: ctx.userId,
          participantId: args.participantId,
        },
      });

      await invalidateCache(`debate:${args.debateId}`);
      const tally = await ctx.prisma.debateVote.groupBy({
        by: ["participantId"],
        where: { debateId: args.debateId },
        _count: { participantId: true },
      });
      const votes: Record<string, number> = {};
      for (const t of tally) votes[t.participantId] = t._count.participantId;

      emitDebateUpdate(args.debateId, "debate:votesUpdated", { votes });

      return vote;
    },

    updateMaxSpectators: async (
      _parent: unknown,
      args: { debateId: string; count: number },
      ctx: GraphQLContext,
    ) => {
      const debate = await ctx.prisma.debate.findUnique({
        where: { id: args.debateId },
        select: { spectators: true, status: true },
      });
      if (!debate) throw new Error("Debate not found");
      if (debate.status === "Completed") return debate;
      if (args.count <= debate.spectators) return debate;

      const updated = await ctx.prisma.debate.update({
        where: { id: args.debateId },
        data: { spectators: args.count },
      });
      await invalidateCache(`debate:${args.debateId}`);
      return updated;
    },
    cancelDebate: async (
      _parent: unknown,
      args: { debateId: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.userId) {
        throw new Error("Not authenticated");
      }

      const debate = await ctx.prisma.debate.findUnique({
        where: { id: args.debateId },
        include: { participants: { include: { user: true } } },
      });
      if (!debate) {
        throw new Error("Debate not found");
      }

      const isParticipant = debate.participants.some(
        (p) => p.userId === ctx.userId,
      );
      if (!isParticipant) {
        throw new Error("Only debate participants can cancel this debate");
      }

      if (debate.status === "Completed" || debate.status === "Cancelled") {
        throw new Error(
          `This debate is already ${debate.status.toLowerCase()}`,
        );
      }

      const updated = await ctx.prisma.debate.update({
        where: { id: args.debateId },
        data: { status: "Cancelled" },
        include: { participants: { include: { user: true } } },
      });

      await Promise.all([
        invalidateCache(`debate:${args.debateId}`),
        invalidateCache("debates:open"),
      ]);
      emitDebateUpdate(args.debateId, "debate:cancelled", {
        status: "Cancelled",
      });
      return updated;
    },
  },
};
