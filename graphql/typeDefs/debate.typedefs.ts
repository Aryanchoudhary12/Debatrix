export const debateTypeDefs = `#graphql
    type Debate{
        id:ID!
        title:String!
        status:String!
        CurrentUserId:String
        OpponentId:String
        voteCountUser1:Int!
        voteCountUser2:Int!
        CurrentUser:User
        spectators:Int!
        Opponent:User
        createdAt:String!
        startedAt:String
        turnStartedAt:String
        activeUserId:String
    }
    type User{
        id:ID!
        name:String!
        image:String
    }
    type Listener{
        id: ID!
        userId: ID!
        user: User!
        listenerStats: ListenerStats!
    }
    type ListenerStats {
        id: ID!
        elo: Int!
        logicScore: Int!
        overallScore: Int!
        persuasionScore: Int!
        factCheckAccuracy: Int!
        aiFeedbackSummary: String
    }
    type Query{
        getDebateById(id:ID!):Debate
        getDebatesByUserId(userId:ID!):[Debate!]!
        getOpenDebates: [Debate!]!
    }
    type Mutation{
        createDebate(title:String!,CurrentUserId:String!):Debate!
        joinDebate(debateId:ID!,userId:String!):Debate!
        voteOnDebate(debateId: ID!, votedForUserId: String!, previousVoteUserId: String): Debate!
        updateMaxSpectators(debateId: ID!, count: Int!): Debate!
    }
`;
