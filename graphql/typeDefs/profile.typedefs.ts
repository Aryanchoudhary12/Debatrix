export const listenerTypeDefs = `#graphql
type User {
  id: ID!
  name: String!
  email: String!
  image: String
  listener: Listener
  debateEntries: [DebateParticipant!]!
  createdAt: String!
  updatedAt: String!
}

type Listener {
  id: ID!
  userId: ID!
  user: User!
  tagline: String
  interests: [String!]!
  likes: Int!
  listenerStats: ListenerStats!
  createdAt: String!
  updatedAt: String!
}

type ListenerStats {
  id: ID!
  elo: Int!
  logicScore: Float!
  overallScore: Float!
  persuasionScore: Float!
  factCheckAccuracy: Float!
  aiFeedbackSummary: String
  createdAt: String!
  updatedAt: String!
}

type Query {
  me: User
  user(id: ID!): User
  listenerByUser(userId: ID!): Listener
}

type Mutation {
  createListener(
    userId: ID!
    tagline: String
    interests: [String!]!
  ): Listener!

  updateListener(
    id: ID!
    tagline: String
    interests: [String!]
  ): Listener!
}
`;