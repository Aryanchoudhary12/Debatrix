export const debateTurnTypeDefs = `#graphql
  type DebateTurn {
    id: ID!
    debateId: ID!
    speakerId: ID!
    content: String!
    turnIndex: Int!
    createdAt: String!
  }

  extend type Mutation {
    recordDebateTurn(
      debateId: ID!
      content: String!
      turnIndex: Int!
    ): DebateTurn!

    finalizeDebate(debateId: ID!): Debate!
  }
`;