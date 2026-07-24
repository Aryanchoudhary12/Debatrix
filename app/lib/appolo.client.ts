import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

let client: ApolloClient | undefined;

export function getApolloClient() {
  if (!client) {
    client = new ApolloClient({
      link: new HttpLink({
        uri: "/api/graphql",
        credentials: "same-origin",
      }),
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: { fetchPolicy: "cache-and-network" },
      },
    });
  }
  return client;
}
