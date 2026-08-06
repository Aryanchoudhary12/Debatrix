export const roastTypeDefs = `#graphql
    type Roast{
        id:ID!
        title:String!
        user:User
        messages:[Message]
        createdAt:String
    }
    type User{
        id:ID!
        name:String!
        image:String
        Listener:Listener
    }
    type Message{
        id:ID!
        roastId:ID!
        content:String!
        sender:String!
        roastLevel:Int
        logicCheck:String
        burnScore:Int
        prompt:String
        createdAt:String!
    }
    type Listener{
        id:ID!
        ListenerStats:ListenerStats
    }
    type ListenerStats{
        listenerId:ID!
        overallScore: Float!
        persuasionScore: Float!
        aiFeedbackSummary: String
    }
    enum MessageSender {
        AI
        User
    }
    type Query{
        getRoastsByUserId(userId:String!):[Roast]
        getRoastById(id:String!):Roast
    }
    type Mutation{
        createRoast(title:String!,userId:String!):Roast
        createMessageUser(roastId:ID!,content:String!,sender:MessageSender!,prompt:String):Message
        AiFeedBack(roastId:ID!,prompt:String!):Message
    }
`;
