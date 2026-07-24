"use client";
import { ApolloProvider } from "@apollo/client/react";
import { getApolloClient } from "@/app/lib/appolo.client";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <ApolloProvider client={getApolloClient()}>{children}</ApolloProvider>;
}