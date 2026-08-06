export const debateTypeDefs = `#graphql
    type Debate {
        id: ID!
        title: String!
        status: DebateStatus!
        spectators: Int!
        createdAt: String!
        startedAt: String
        turnStartedAt: String
        activeUserId: String
        participants: [DebateParticipant!]!
        votes: [DebateVote!]!
    }
    enum DebateStatus {
        Waiting
        Live
        Completed
        Cancelled
    }
    type DebateParticipant {
        id: ID!
        userId: ID!
        user: User!
        debateId: ID!
        debate: Debate!
        votesReceived: [DebateVote!]!
        role: Role!
        overallScore: Float
        logicScore: Float
        persuasionScore: Float
        factCheckAccuracy: Float
        feedbackSummary: String
    }
    enum Role {
        Creator
        Opponent
    }
    type DebateVote {
        id: ID!
        debateId: ID!
        debate: Debate!
        voterId: ID!
        voter: User!
        participantId: ID!
        participant: DebateParticipant!
    }
    type User {
        id: ID!
        name: String!
        image: String
    }
    type Listener {
        id: ID!
        userId: ID!
        user: User!
        listenerStats: ListenerStats!
    }
    type ListenerStats {
        id: ID!
        elo: Int!
        logicScore: Float!
        overallScore: Float!
        persuasionScore: Float!
        factCheckAccuracy: Float!
        aiFeedbackSummary: String
    }
    type Query {
        getDebateById(id: ID!): Debate
        getDebatesByUserId(userId: ID!): [Debate!]!
        getOpenDebates: [Debate!]!
    }
    type Mutation {
        createDebate(title: String!): Debate!
        joinDebate(debateId: ID!, userId: ID!): Debate!
        voteOnDebate(debateId: ID!, participantId: ID!): DebateVote!
        updateMaxSpectators(debateId: ID!, count: Int!): Debate!
        cancelDebate(debateId: ID!): Debate!
    }
`;