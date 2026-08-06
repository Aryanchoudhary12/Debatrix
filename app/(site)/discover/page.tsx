"use client";
import { useState } from "react";
import { ActiveDebates } from "@/app/(site)/profile/components/debate";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Loading from "@/app/loading";
import toast from "react-hot-toast";
import { SquigglyText } from "@/app/components/ui/squiggly-text";
import Button from "@/app/components/ui/button";

const GET_ACTIVE_DEBATES = gql`
  query GetOpenDebates {
    getOpenDebates {
      id
      title
      spectators
      status
      createdAt
      startedAt
      participants {
        id
        userId
        role
        user {
          id
          name
        }
        votesReceived {
          id
          voterId
          participantId
        }
      }
    }
  }
`;

const JOIN_DEBATE = gql`
  mutation JoinDebate($debateId: ID!, $userId: ID!) {
    joinDebate(debateId: $debateId, userId: $userId) {
      id
    }
  }
`;

function Discover() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data, loading } = useQuery<{ getOpenDebates: any[] }>(
    GET_ACTIVE_DEBATES,
  );
  console.log("Active debates data:", data);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joinDebate] = useMutation(JOIN_DEBATE, {
    onCompleted: (data: any) => {
      setJoiningId(null);
      router.push(`/debate/${data.joinDebate.id}`);
    },
    onError: (err) => {
      setJoiningId(null);
      toast.error(err.message || "Couldn't join this debate");
    },
  });
  const handleJoin = async (debateId: string) => {
    setJoiningId(debateId);
    try {
      if (!session?.user?.id) {
        toast.error("Sign in to join a debate");
        return;
      }
      joinDebate({ variables: { debateId, userId: session.user.id } });
    } catch (error) {
      console.error("Error joining debate:", error);
      toast.error("An error occurred while trying to join the debate.");
    } finally {
      setJoiningId(null);
    }
  };

  const debates = data?.getOpenDebates?.map((debate: any) => ({
    id: debate.id,
    category: "Clash of Ideas",
    topic: debate.title,
    opponent:debate.participants.find((p: any) => p.role === "Creator")?.user?.name || "TBD",
    status: debate.status,
    spectators: debate.spectators,
    userVotes: 0,
    opponentVotes: 0,
  }));

  if (loading) return <Loading />;

  return (
    <div className="flex flex-col items-center min-h-screen pt-20 p-6 w-full">
      <div className="text-2xl font-bold font-montserrat w-full">
        <span className="text-secondary uppercase text-xs font-montserrat tracking-wider">
          Live Debates
        </span>
        <h1 className="text-3xl font-extrabold font-poppins">Overview</h1>
      </div>
      <div className="flex flex-col gap-4 w-full mt-6">
        {debates && debates.length > 0 ? (
          <ActiveDebates
            debates={debates}
            onJoin={handleJoin}
            joiningId={joiningId}
          />
        ) : (
          <div>
            <SquigglyText
              stepDuration={70}
              scale={[6, 9]}
              className="text-amber-500 font-montserrat font-extrabold text-3xl md:text-4xl"
            >
              No Active Debates Found
            </SquigglyText>{" "}
            <p className="text-accent mt-4 font-poppins text-sm font-medium max-w-lg">
              There are currently no active debates available. Please check back
              later or create a new debate to get started.
            </p>
            <Button className="mt-4 rounded-sm" variant="secondary" onClick={() => router.push("/debate/create")}>
              Create Debate
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Discover;
