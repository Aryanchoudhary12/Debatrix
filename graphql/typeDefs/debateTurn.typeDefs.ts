export const debateTurnTypeDefs = `#graphql
  type DebateTurn {
    id: ID!
    debateId: ID!
    debate: Debate!
    participantId: ID!
    participant: DebateParticipant!
    content: String!
    turnIndex: Int!
    createdAt: String!
  }

  extend type Mutation {
    recordDebateTurn(debateId: ID!, content: String!): DebateTurn!
    finalizeDebate(debateId: ID!): Debate!
    
  }
`;
