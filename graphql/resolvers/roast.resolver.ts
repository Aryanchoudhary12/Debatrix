import { getOrSetCache, invalidateCache } from "@/app/lib/cache";
import type { GraphQLContext } from "../../types/context";
import { generateRoastFeedback } from "@/app/lib/roast-groq";

export const roastResolvers = {
  Query: {
    getRoastsByUserId: async (
      _parent: unknown,
      args: { userId: string },
      ctx: GraphQLContext,
    ) => {
      const cacheKey = `roasts:byUser:${args.userId}`;
      return getOrSetCache(cacheKey, 60, () =>
        ctx.prisma.roast.findMany({
          where: { userId: args.userId },
          include: {
            user: true,
            messages: true,
            roastStats: true,
          },
        }),
      );
    },
    getRoastById: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) => {
      const cacheKey = `roasts:${args.id}`;
      try {
        const result = await getOrSetCache(cacheKey, 60, () =>
          ctx.prisma.roast.findUnique({
            where: { id: args.id },
            include: {
              user: true,
              messages: true,
              roastStats: true,
            },
          }),
        );
        return result;
      } catch (error) {
        console.error("Error fetching roast by ID:", error);
        throw new Error("Failed to fetch roast by ID.");
      }
    },
  },
  Mutation: {
    createRoast: async (
      _parent: unknown,
      args: { title: string; userId: string },
      ctx: GraphQLContext,
    ) => {
      const newRoast = await ctx.prisma.roast.create({
        data: {
          title: args.title,
          userId: args.userId,
          roastStats: {
            create: {},
          },
        },
      });
      await invalidateCache(`roasts:byUser:${args.userId}`);
      return newRoast;
    },
    createMessageUser: async (
      _parent: unknown,
      args: {
        roastId: string;
        content: string;
        prompt?: string;
      },
      ctx: GraphQLContext,
    ) => {
      const newMessage = await ctx.prisma.message.create({
        data: {
          roastId: args.roastId,
          content: args.content,
          sender: "User",
          prompt: args.prompt || null,
        },
      });
      await invalidateCache(`roasts:${args.roastId}`);
      return newMessage;
    },
    AiFeedBack: async (
      _parent: unknown,
      args: { roastId: string; prompt: string; title: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.userId) {
        throw new Error("You must be signed in to get AI feedback.");
      }

      const roast = await ctx.prisma.roast.findUnique({
        where: { id: args.roastId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
      if (!roast) throw new Error("Roast not found");
      if (roast.userId !== ctx.userId) {
        throw new Error("Not authorized to get feedback on this roast.");
      }

      const feedback = await generateRoastFeedback(
        args.prompt,
        roast.messages.map((m) => ({ sender: m.sender, content: m.content })),
        args.title,
      );
      const [aiMessage] = await ctx.prisma.$transaction([
        ctx.prisma.message.create({
          data: {
            roastId: args.roastId,
            content: feedback.roastText,
            sender: "AI",
            prompt: args.prompt,
            roastLevel: feedback.roastLevel,
            logicCheck: feedback.logicCheck,
            burnScore: feedback.burnScore,
          },
        }),
        ctx.prisma.roastStats.upsert({
          where: { roastId: args.roastId },
          create: {
            roastId: args.roastId,
            overallScore: feedback.overallScore,
            persuasionScore: feedback.persuasionScore,
            aiFeedbackSummary: feedback.roastText,
          },
          update: {
            overallScore: feedback.overallScore,
            persuasionScore: feedback.persuasionScore,
            aiFeedbackSummary: feedback.roastText,
          },
        }),
      ]);
      await invalidateCache(`roasts:${args.roastId}`);

      return aiMessage;
    },
  },
};
