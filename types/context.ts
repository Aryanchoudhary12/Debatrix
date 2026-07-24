import { PrismaClient } from "@/app/generated/prisma/client";

export interface GraphQLContext {
  prisma: PrismaClient;
  userId?: string;
}