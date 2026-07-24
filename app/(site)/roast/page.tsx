"use client";
import { useState } from "react";
import { ChatInput } from "./components/chatInput";
import { RoastResponseCard } from "./components/RoastCard";
import { ChatSidebar } from "./components/Sidebar";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { useSession } from "next-auth/react";
import { useRoastStore } from "@/app/store/roastStore";
import toast from "react-hot-toast";
import NoData from "@/app/components/blocks/no-data";
import Loading from "@/app/loading";
import Error from "@/app/components/blocks/error";
import { LoaderOne } from "@/app/components/blocks/loader";

interface UserMessageProps {
  message: string;
}
const UserMessage: React.FC<UserMessageProps> = ({ message }) => {
  return (
    <div className="flex w-full justify-end mb-6">
      <div className="bg-accent backdrop-blur-md  rounded-2xl rounded-tr-sm p-4 shadow-lg">
        <p className="font-poppins text-muted text-sm leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  );
};

const GET_LISTENER_BY_USER_ID = gql`
  query listenerByUser($userId: ID!) {
    listenerByUser(userId: $userId) {
      id
      userId
      tagline
      interests
      listenerStats {
        elo
        logicScore
        overallScore
        persuasionScore
        factCheckAccuracy
        aiFeedbackSummary
      }
      user {
        name
        image
        createdAt
      }
    }
  }
`;
const GET_ROASTS_BY_ID = gql`
  query getRoastById($id: String!) {
    getRoastById(id: $id) {
      id
      title
      messages {
        id
        roastId
        content
        sender
        roastLevel
        logicCheck
        burnScore
        prompt
        createdAt
      }
    }
  }
`;
const CREATE_MESSAGE_USER = gql`
  mutation createMessageUser(
    $roastId: ID!
    $content: String!
    $sender: MessageSender!
  ) {
    createMessageUser(roastId: $roastId, content: $content, sender: $sender) {
      id
      content
      sender
      createdAt
      roastLevel
      logicCheck
      burnScore
    }
  }
`;

const AI_FEEDBACK = gql`
  mutation AiFeedBack($roastId: ID!, $prompt: String!) {
    AiFeedBack(roastId: $roastId, prompt: $prompt) {
      id
      content
      sender
      roastLevel
      logicCheck
      burnScore
      createdAt
    }
  }
`;

const MESSAGE_FRAGMENT = gql`
  fragment NewRoastMessage on Message {
    id
    content
    sender
    roastLevel
    logicCheck
    burnScore
    createdAt
  }
`;

interface RoastMessage {
  id: string;
  roastId: string;
  content: string;
  sender: string;
  roastLevel: number | null;
  logicCheck: string | null;
  burnScore: number | null;
  prompt: string | null;
  createdAt: Date;
}

export default function RoastBotPage() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const { roastId } = useRoastStore();
  const userId = session?.user?.id;
  const { data, loading, error } = useQuery<{
    listenerByUser: {
      id: string;
      userId: string;
      tagline: string;
      interests: string[];
      listenerStats: any;
      user: { name: string; image: string; createdAt: Date };
    };
  }>(GET_LISTENER_BY_USER_ID, {
    variables: { userId },
    skip: !userId,
  });

  const {
    data: roastData,
    loading: roastLoading,
    error: roastError,
  } = useQuery<{
    getRoastById: {
      id: string;
      title: string;
      messages: RoastMessage[];
    };
  }>(GET_ROASTS_BY_ID, {
    variables: { id: roastId },
    skip: !roastId,
  });

  const [isAiThinking, setIsAiThinking] = useState(false);

  const [createMessageUser] = useMutation<{
    createMessageUser: {
      id: string;
      content: string;
      sender: "AI" | "User";
      createdAt: Date;
    };
  }>(CREATE_MESSAGE_USER, {
    update(cache, { data }) {
      if (!data?.createMessageUser) return;
      const ref = cache.writeFragment({
        id: cache.identify({
          __typename: "Message",
          id: data.createMessageUser.id,
        }),
        fragment: MESSAGE_FRAGMENT,
        data: { ...data.createMessageUser, __typename: "Message" },
      });
      if (!ref) return;

      cache.modify({
        id: cache.identify({ __typename: "Roast", id: roastId }),
        fields: {
          messages(existingMessages = []) {
            return [...existingMessages, ref];
          },
        },
      });
    },
  });

  const [aiFeedback] = useMutation<{
    AiFeedBack: {
      id: string;
      roastId: string;
      content: string;
      sender: "AI" | "User";
      prompt: string | null;
      createdAt: Date;
      roastLevel: number | null;
      logicCheck: string | null;
      burnScore: number | null;
    };
  }>(AI_FEEDBACK, {
    update(cache, { data }) {
      if (!data?.AiFeedBack) return;
      const ref = cache.writeFragment({
        id: cache.identify({
          __typename: "Message",
          id: data.AiFeedBack.id,
        }),
        fragment: MESSAGE_FRAGMENT,
        data: { ...data.AiFeedBack, __typename: "Message" },
      });
      if (!ref) return;

      cache.modify({
        id: cache.identify({ __typename: "Roast", id: roastId }),
        fields: {
          messages(existingMessages = []) {
            return [...existingMessages, ref];
          },
        },
      });
    },
  });

  const handleSubmit = async (content: string) => {
    if (!roastId) {
      toast.error("Select or start a roast first.");
      return;
    }

    setIsAiThinking(true);
    try {
      await createMessageUser({
        variables: { roastId, content, sender: "User" },
      });
      await aiFeedback({
        variables: { roastId, prompt: content },
      });
    } catch (err) {
      console.error("Roast flow failed:", err);
      toast.error("The AI couldn't respond — try again.");
    } finally {
      setIsAiThinking(false);
    }
  };

  const messages = roastData?.getRoastById?.messages ?? [];

  if (loading || roastLoading) {
    return <Loading />;
  }

  return (
    <main className="min-h-screen  flex items-center justify-center p-6 pt-20 w-full h-full">
      <div className="w-full max-w-6xl h-[85vh] flex flex-col gap-2 lg:gap-0 lg:flex-row relative">
        <ChatSidebar
          username={
            data?.listenerByUser?.user.name ||
            session?.user?.name ||
            "Unknown User"
          }
          imageUrl={data?.listenerByUser?.user.image || undefined}
          overallScore={data?.listenerByUser?.listenerStats?.overallScore || 0}
          persuasionScore={
            data?.listenerByUser?.listenerStats?.persuasionScore || 0
          }
          aiFeedbackSummary={
            data?.listenerByUser?.listenerStats?.aiFeedbackSummary ||
            "No AI feedback available yet. Engage in debates to receive insights."
          }
          open={open}
          setOpen={setOpen}
        />
        <div className="flex-1 flex flex-col relative bg-muted/25 backdrop-blur-lg rounded-2xl lg:rounded-l-none border border-primary/25 w-full">
          <header className="p-2 px-4 border-b border-primary/25">
            <span className="text-xl text-secondary font-fascinate-inline font-black tracking-tight">
              ArguRoast AI
            </span>
            <p className="text-secondary text-shadow-md text-shadow-sky-500 text-xs font-montserrat font-extrabold mt-0.5 ">
              {roastLoading
                ? "Loading roast..."
                : roastData?.getRoastById?.title ||
                  "Select a roast to view its details..."}
            </p>
          </header>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-none scrollbar-thumb-primary scrollbar-track-transparent">
            {error && (
              <Error
                title="Couldn't load your profile"
                description="Some stats in the sidebar may be out of date."
              />
            )}

            {!roastId && (
              <NoData
                title={"No Roast Selected"}
                description="Select or start a roast to begin the debate!"
              />
            )}

            {roastError && (
              <Error
                title={"Error Loading Roast"}
                description="Failed to load this roast. Try again."
              />
            )}

            {roastId && !roastError && messages.length === 0 && (
              <NoData
                title="No messages yet"
                description="Type your first argument below to get roasted."
              />
            )}

            {messages.map((msg) =>
              msg.sender === "User" ? (
                <UserMessage key={msg.id} message={msg.content} />
              ) : (
                <RoastResponseCard
                  key={msg.id}
                  roastText={msg.content}
                  analytics={{
                    roastLevel: msg.roastLevel ?? 0,
                    logicCheck: msg.logicCheck ?? "",
                    burnScore: msg.burnScore ?? 0,
                  }}
                />
              ),
            )}

            {isAiThinking && (
              <div className="flex justify-start mb-2 bg-primary/10 backdrop-blur-md rounded-3xl rounded-tl-sm p-4 pb-6 w-fit border border-primary/25">
                <LoaderOne />
              </div>
            )}
          </div>
          {roastId && <ChatInput onSubmit={handleSubmit} />}
        </div>
      </div>
    </main>
  );
}
