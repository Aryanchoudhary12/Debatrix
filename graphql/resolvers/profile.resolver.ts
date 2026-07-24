import { getOrSetCache, invalidateCache } from "@/app/lib/cache";
import type { GraphQLContext } from "../../types/context";

export const listenerResolvers = {
  User: {
    listener: (parent: { Listener?: unknown }) => parent.Listener ?? null,
  },

  Query: {
    user: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) => {
      const cacheKey = `user:${args.id}`;

      return getOrSetCache(cacheKey, 60, () =>
        ctx.prisma.user.findUnique({
          where: { id: args.id },
          include: {
            Listener: {
              include: {
                listenerStats: true,
              },
            },
          },
        }),
      );
    },

    listenerByUser: async (
      _parent: unknown,
      args: { userId: string },
      ctx: GraphQLContext,
    ) => {
      const cacheKey = `listener:byUser:${args.userId}`;
      return getOrSetCache(cacheKey, 60, () =>
        ctx.prisma.listener.findUnique({
          where: { userId: args.userId },
          include: {
            listenerStats: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                debatesAsCurrentUser: {
                  include: {
                    CurrentUser: { select: { name: true } },
                    Opponent: { select: { name: true } },
                  },
                },
                debatesAsOpponent: {
                  include: {
                    CurrentUser: { select: { name: true } },
                    Opponent: { select: { name: true } },
                  },
                },
                createdAt: true,
              },
            },
          },
        }),
      );
    },

    me: async (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
      if (!ctx.userId) return null;
      const cacheKey = `user:${ctx.userId}`;
      return getOrSetCache(cacheKey, 60, () =>
        ctx.prisma.user.findUnique({
          where: {
            id: ctx.userId,
          },
          include: {
            Listener: {
              include: {
                listenerStats: true,
              },
            },
          },
        }),
      );
    },
  },

  Mutation: {
    createListener: async (
      _parent: unknown,
      args: {
        userId: string;
        tagline?: string;
        interests: string[];
      },
      ctx: GraphQLContext,
    ) => {
      const listener = await ctx.prisma.listener.create({
        data: {
          userId: args.userId,
          tagline: args.tagline,
          interests: args.interests,
          listenerStats: {
            create: {},
          },
        },
        include: {
          listenerStats: true,
          user: true,
        },
      });
      await invalidateCache(`user:${args.userId}`);
      return listener;
    },

    updateListener: async (
      _parent: unknown,
      args: { id: string; tagline?: string; interests?: string[] },
      ctx: GraphQLContext,
    ) => {
      const listener = await ctx.prisma.listener.update({
        where: { id: args.id },
        data: {
          tagline: args.tagline,
          interests: args.interests,
        },
      });
      await invalidateCache(`user:${listener.userId}`);

      return listener;
    },
  },
};
