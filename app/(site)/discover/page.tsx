"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ActiveDebates } from "@/app/(site)/profile/components/debate";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Loading from "@/app/loading";
import toast from "react-hot-toast";
import { SquigglyText } from "@/app/components/ui/squiggly-text";
import Button from "@/app/components/ui/button";

const GET_OPEN_DEBATES = gql`
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

const GET_DEBATES_BY_STATUS = gql`
  query GetDebatesByStatus($status: DebateStatus!) {
    getDebatesByStatus(status: $status) {
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

type TabKey = "Open" | "Live" | "Completed";

const TABS: { key: TabKey; label: string }[] = [
  { key: "Open", label: "Open" },
  { key: "Live", label: "Live" },
  { key: "Completed", label: "Completed" },
];

interface RawDebate {
  id: string;
  title: string;
  spectators: number;
  status: string;
  createdAt: string;
  startedAt: string | null;
  participants: {
    id: string;
    userId: string;
    role: string;
    user: { id: string; name: string };
    votesReceived: { id: string; voterId: string; participantId: string }[];
  }[];
}

type DebateStatus = "Live" | "Completed" | "Waiting" | "Cancelled";

function isDebateStatus(status: string): status is DebateStatus {
  return (
    status === "Live" ||
    status === "Completed" ||
    status === "Waiting" ||
    status === "Cancelled"
  );
}

function mapDebate(debate: RawDebate) {
  const status: DebateStatus = isDebateStatus(debate.status)
    ? debate.status
    : "Waiting";

  return {
    id: debate.id,
    category: "Clash of Ideas",
    topic: debate.title,
    opponent:
      debate.participants.find((p) => p.role === "Creator")?.user?.name ||
      "TBD",
    status,
    spectators: debate.spectators,
    userVotes: 0,
    opponentVotes: 0,
  };
}

function Discover() {
  const router = useRouter();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabKey>("Open");

  const { data: openData, loading: openLoading } = useQuery<{
    getOpenDebates: RawDebate[];
  }>(GET_OPEN_DEBATES, {});

  const { data: liveData, loading: liveLoading } = useQuery<{
    getDebatesByStatus: RawDebate[];
  }>(GET_DEBATES_BY_STATUS, {
    variables: { status: "Live" },
  });

  const { data: completedData, loading: completedLoading } = useQuery<{
    getDebatesByStatus: RawDebate[];
  }>(GET_DEBATES_BY_STATUS, {
    variables: { status: "Completed" },
  });

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

  const handleSpectate = (debateId: string) => {
    router.push(`/debate/${debateId}`);
  };

  const openDebates = openData?.getOpenDebates?.map(mapDebate) ?? [];
  const liveDebates = liveData?.getDebatesByStatus?.map(mapDebate) ?? [];
  const completedDebates =
    completedData?.getDebatesByStatus?.map(mapDebate) ?? [];

  const tabConfig: Record<
    TabKey,
    {
      debates: ReturnType<typeof mapDebate>[];
      loading: boolean;
      onAction: (id: string) => void;
      actionLabel?: string;
    }
  > = {
    Open: {
      debates: openDebates,
      loading: openLoading,
      onAction: handleJoin,
    },
    Live: {
      debates: liveDebates,
      loading: liveLoading,
      onAction: handleSpectate,
      actionLabel: "Watch",
    },
    Completed: {
      debates: completedDebates,
      loading: completedLoading,
      onAction: handleSpectate,
      actionLabel: "View Results",
    },
  };

  const current = tabConfig[activeTab];

  return (
    <div className="flex flex-col items-center min-h-screen pt-20 p-6 w-full">
      <div className="text-2xl font-bold font-montserrat w-full">
        <span className="text-secondary uppercase text-xs font-montserrat tracking-wider">
          Live Debates
        </span>
        <h1 className="text-3xl font-extrabold font-poppins">Overview</h1>
      </div>

      <div className="flex gap-2 w-full mt-6 border-b border-primary/10">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-4 py-2 text-sm font-poppins font-semibold rounded-t-lg transition-colors ${
              activeTab === tab.key
                ? "text-accent bg-primary/5"
                : "text-secondary hover:text-accent/80"
            }`}
          >
            {tab.label}
            {tabConfig[tab.key].debates.length > 0 && (
              <span className="ml-2 text-xs text-secondary/70">
                ({tabConfig[tab.key].debates.length})
              </span>
            )}
            {activeTab === tab.key && (
              <motion.div
                layoutId="discover-tab-underline"
                className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-accent"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 w-full mt-6">
        {current.loading ? (
          <Loading />
        ) : current.debates.length > 0 ? (
          <ActiveDebates
            debates={current.debates}
            onJoin={current.onAction}
            joiningId={joiningId}
          />
        ) : (
          <div>
            <SquigglyText
              stepDuration={70}
              scale={[6, 9]}
              className="text-amber-500 font-montserrat font-extrabold text-3xl md:text-4xl"
            >
              No {activeTab} Debates Found
            </SquigglyText>{" "}
            <p className="text-accent mt-4 font-poppins text-sm font-medium max-w-lg">
              {activeTab === "Open"
                ? "There are currently no active debates available. Please check back later or create a new debate to get started."
                : `There are no ${activeTab.toLowerCase()} debates right now.`}
            </p>
            {activeTab === "Open" && (
              <Button
                className="mt-4 rounded-sm"
                variant="secondary"
                onClick={() => router.push("/debate/create")}
              >
                Create Debate
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Discover;