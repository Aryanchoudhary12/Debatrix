"use client";
import { ProfileSidebar } from "./components/profileSidebar";
import { StatsGrid } from "./components/statsGrid";
import { AnalyticsSection } from "./components/analytics";
import { ActiveDebates } from "./components/debate";
import { useSession } from "next-auth/react";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import Loading from "@/app/loading";
import Button from "@/app/components/ui/button";
import toast from "react-hot-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
        debatesAsCurrentUser {
          id
          title
          status
          voteCountUser1
          voteCountUser2
          CurrentUser {
            name
          }
          Opponent {
            name
          }
          spectators
          createdAt
        }
        debatesAsOpponent {
          id
          title
          status
          voteCountUser1
          voteCountUser2
          CurrentUser {
            name
          }
          Opponent {
            name
          }
          spectators
          createdAt
        }
      }
      createdAt
    }
  }
`;
const JOIN_DEBATE = gql`
  mutation JoinDebate($debateId: ID!, $userId: String!) {
    joinDebate(debateId: $debateId, userId: $userId) {
      id
    }
  }
`;
interface DebateRoom {
  id: string;
  topic: string;
  category: string;
  opponent: string;
  status: "Waiting" | "Live" | "Completed" | "Cancelled";
  spectators: number;
  userVotes: number;
  opponentVotes: number;
}

const VALID_STATUSES: DebateRoom["status"][] = [
  "Waiting",
  "Live",
  "Completed",
  "Cancelled",
];

function normalizeStatus(status: string): DebateRoom["status"] {
  return VALID_STATUSES.includes(status as DebateRoom["status"])
    ? (status as DebateRoom["status"])
    : "Waiting";
}

function mapDebate(raw: any, viewerIsCurrentUser: boolean): DebateRoom {
  const opponentName = viewerIsCurrentUser
    ? raw.Opponent?.name
    : raw.CurrentUser?.name;

  return {
    id: raw.id,
    topic: raw.title,
    category: "General",
    opponent: opponentName ?? "Waiting for opponent",
    status: normalizeStatus(raw.status),
    spectators: raw.spectators ?? 0,
    userVotes: viewerIsCurrentUser ? raw.voteCountUser1 : raw.voteCountUser2,
    opponentVotes: viewerIsCurrentUser
      ? raw.voteCountUser2
      : raw.voteCountUser1,
  };
}

function buildActiveRooms(user: {
  debatesAsCurrentUser: any[];
  debatesAsOpponent: any[];
}): DebateRoom[] {
  const asCurrentUser = (user.debatesAsCurrentUser ?? []).map((d) =>
    mapDebate(d, true),
  );
  const asOpponent = (user.debatesAsOpponent ?? []).map((d) =>
    mapDebate(d, false),
  );
  return [...asCurrentUser, ...asOpponent];
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const router = useRouter();
  const { data, loading } = useQuery<{
    listenerByUser: any;
  }>(GET_LISTENER_BY_USER_ID, {
    variables: { userId },
    skip: !userId,
    pollInterval: 30000,
  });
  const listenerData = data?.listenerByUser;
  const activeRooms = data?.listenerByUser?.user
    ? buildActiveRooms(data.listenerByUser.user)
    : [];

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
  function computeDebateStats(rooms: DebateRoom[]) {
    const completed = rooms.filter((r) => r.status === "Completed");

    let wins = 0;
    let losses = 0;

    completed.forEach((r) => {
      if (r.userVotes > r.opponentVotes) wins++;
      else if (r.opponentVotes > r.userVotes) losses++;
    });

    const decided = wins + losses;
    const winRate =
      decided > 0 ? `${Math.round((wins / decided) * 100)}%` : "N/A";

    return {
      totalDebates: rooms.length,
      wins,
      losses,
      winRate,
    };
  }
  const { totalDebates, wins, losses, winRate } =
    computeDebateStats(activeRooms);
  const profileData = {
    listenerId: listenerData?.id,
    username: listenerData?.user.name || session?.user?.name || "Unknown User",
    imageUrl: listenerData?.user.image || undefined,
    tagline:
      listenerData?.tagline ||
      "Tagline not set yet - update your profile to set it.",
    elo: listenerData?.listenerStats?.elo || 0,
    likes: listenerData?.listenerStats?.likes || 0,
    joinedDate: listenerData?.user.createdAt || "N/A",
    interests: listenerData?.interests || [],
    stats: [
      { label: "Total Debates", value: totalDebates },
      {
        label: "Wins / Losses",
        value: `${wins} / ${losses}`,
        highlight: true,
      },
      {
        label: "Win Rate",
        value: winRate,
      },
      {
        label: "Elo Rating",
        value: listenerData?.listenerStats?.elo || "N/A",
      },
      {
        label: "AI Logic Score",
        value: listenerData?.listenerStats?.logicScore || "N/A",
      },
      {
        label: "Fact Accuracy",
        value: listenerData?.listenerStats?.factCheckAccuracy || "N/A",
      },
    ],
    analytics: {
      overallScore: listenerData?.listenerStats?.overallScore || 0,
      logicScore: listenerData?.listenerStats?.logicScore || 0,
      persuasionScore: listenerData?.listenerStats?.persuasionScore || 0,
      factCheckAccuracy: listenerData?.listenerStats?.factCheckAccuracy || 0,
      aiFeedbackSummary:
        listenerData?.listenerStats?.aiFeedbackSummary ||
        "No AI feedback available yet. Engage in debates to receive insights.",
    },
  };
  if (loading) {
    return <Loading />;
  }
  return (
    <main className="min-h-screen  p-4 sm:px-6 lg:px-8 font-sans w-full pt-20">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
        <ProfileSidebar
          listenerId={profileData.listenerId || ""}
          username={profileData.username}
          imageUrl={profileData.imageUrl}
          tagline={profileData.tagline}
          elo={profileData.elo}
          likes={profileData.likes}
          interests={profileData.interests}
          joinedDate={new Date(profileData.joinedDate).toDateString()}
        />
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          <StatsGrid stats={profileData.stats} />
          <AnalyticsSection
            overallScore={profileData.analytics.overallScore}
            logicScore={profileData.analytics.logicScore}
            persuasionScore={profileData.analytics.persuasionScore}
            factCheckAccuracy={profileData.analytics.factCheckAccuracy}
            aiFeedbackSummary={profileData.analytics.aiFeedbackSummary}
          />
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-accent">
              Active Debate Rooms & Tournaments
            </h3>
            <Button
              variant="outline"
              size="small"
              className="rounded-sm"
              onClick={() => router.push("/discover")}
            >
              View All
            </Button>
          </div>

          <ActiveDebates
            debates={activeRooms}
            onJoin={handleJoin}
            joiningId={joiningId}
          />
        </div>
      </div>
    </main>
  );
}
