import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { NextRequest } from "next/server";
import { typeDefs, resolvers } from "@/graphql/schema";
import prisma from "@/app/lib/prisma";
import type { GraphQLContext } from "@/types/context";
import { auth } from "@/app/auth";

const apolloServer = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== "production",
  ...(process.env.NODE_ENV === "production" && {
    plugins: [
      {
        async serverWillStart() {
          return {};
        },
      },
    ],
  }),
});

const handler = startServerAndCreateNextHandler<NextRequest, GraphQLContext>(
  apolloServer,
  {
    context: async (req): Promise<GraphQLContext> => {
      const session = await auth();
      return {
        prisma: prisma as any,
        userId: session?.user?.id,
      };
    },
  },
);

export { handler as GET, handler as POST };
