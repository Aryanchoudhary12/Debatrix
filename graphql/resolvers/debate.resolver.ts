import { getOrSetCache, invalidateCache } from "@/app/lib/cache";
import type { GraphQLContext } from "../../types/context";
export const debateResolvers = {
  Query: {
    getDebateById: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) => {
      const cacheKey = `debate:${args.id}`;
      return getOrSetCache(cacheKey, 60, () =>
        ctx.prisma.debate.findUnique({
          where: { id: args.id },
          include: {
            CurrentUser: true,
            Opponent: true,
          },
        }),
      );
    },
    getDebatesByUserId: async (
      _parent: unknown,
      args: { userId: string },
      ctx: GraphQLContext,
    ) => {
      const cacheKey = `debates:byUser:${args.userId}`;
      return getOrSetCache(cacheKey, 60, () =>
        ctx.prisma.debate.findMany({
          where: {
            OR: [{ CurrentUserId: args.userId }, { OpponentId: args.userId }],
          },
          include: {
            CurrentUser: true,
            Opponent: true,
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
          where: { OpponentId: null, status: "Waiting" },
          include: { CurrentUser: true },
          orderBy: { createdAt: "asc" },
        }),
      );
    },
  },
  Mutation: {
    createDebate: async (
      _parent: unknown,
      args: { title: string; CurrentUserId: string },
      ctx: GraphQLContext,
    ) => {
      const newDebate = await ctx.prisma.debate.create({
        data: {
          title: args.title,
          CurrentUserId: args.CurrentUserId,
        },
      });
      await invalidateCache("debates:open");
      return newDebate;
    },
    joinDebate: async (
      _parent: unknown,
      args: { debateId: string; userId: string },
      ctx: GraphQLContext,
    ) => {
      if (!args.userId) throw new Error("Not authenticated");
      const now = new Date();
      const debate = await ctx.prisma.debate.findUnique({
        where: { id: args.debateId },
        select: { CurrentUserId: true },
      });
      if (!debate) throw new Error("Debate not found");

      const result = await ctx.prisma.debate.updateMany({
        where: {
          id: args.debateId,
          OpponentId: null,
          CurrentUserId: { not: args.userId },
        },
        data: {
          OpponentId: args.userId,
          status: "Live",
          startedAt: now,
          turnStartedAt: now,
          activeUserId: debate.CurrentUserId,
        },
      });

      if (result.count === 0) {
        throw new Error("This debate is no longer open");
      }

      await Promise.all([
        invalidateCache(`debate:${args.debateId}`),
        invalidateCache(`debates:open`),
      ]);
      return ctx.prisma.debate.findUnique({
        where: { id: args.debateId },
        include: { CurrentUser: true, Opponent: true },
      });
    },
    voteOnDebate: async (
      _parent: unknown,
      args: {
        debateId: string;
        votedForUserId: string;
        previousVoteUserId?: string | null;
      },
      ctx: GraphQLContext,
    ) => {
      const debate = await ctx.prisma.debate.findUnique({
        where: { id: args.debateId },
      });
      if (!debate) throw new Error("Debate not found");
      const resolveField = (userId: string) => {
        if (debate.CurrentUserId === userId) return "voteCountUser1" as const;
        if (debate.OpponentId === userId) return "voteCountUser2" as const;
        return null;
      };
      const newField = resolveField(args.votedForUserId);
      if (!newField) throw new Error("Invalid vote target");
      const data: Record<
        string,
        { increment: number } | { decrement: number }
      > = {};

      if (args.previousVoteUserId === args.votedForUserId) {
        data[newField] = { decrement: 1 };
      } else {
        data[newField] = { increment: 1 };
        if (args.previousVoteUserId) {
          const prevField = resolveField(args.previousVoteUserId);
          if (prevField && prevField !== newField) {
            data[prevField] = { decrement: 1 };
          }
        }
      }
      const updatedDebate = await ctx.prisma.debate.update({
        where: { id: args.debateId },
        data,
      });
      await invalidateCache(`debate:${args.debateId}`);
      return updatedDebate;
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

      if (args.count <= debate.spectators) {
        return debate;
      }

      const updated = await ctx.prisma.debate.update({
        where: { id: args.debateId },
        data: { spectators: args.count },
      });
      await invalidateCache(`debate:${args.debateId}`);
      return updated;
    },
  },
};
