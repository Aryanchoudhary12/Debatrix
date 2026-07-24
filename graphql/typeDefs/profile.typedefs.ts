export const listenerTypeDefs = `#graphql
type User {
  id: ID!
  name: String!
  email: String!
  image: String
  listener: Listener
  debatesAsCurrentUser: [Debate!]!
  debatesAsOpponent: [Debate!]!
  createdAt: String!
  updatedAt: String!
}

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
}

type Listener {
  id: ID!
  userId: ID!
  user: User!
  tagline: String
  interests: [String!]!
  listenerStats: ListenerStats!
  createdAt: String!
  updatedAt: String!
}

type ListenerStats {
  id: ID!
  elo: Int!
  logicScore: Int!
  overallScore: Int!
  persuasionScore: Int!
  factCheckAccuracy: Int!
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
