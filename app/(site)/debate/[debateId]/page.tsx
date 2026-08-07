"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import DebateHeader from "../components/DebateHeader";
import VotingSection from "../components/VotingSection";
import AIAnalyticsDashboard, {
  DebateMetrics,
} from "../components/AIAnalyticsDashboard";
import { useDebateRoom } from "@/app/store/debateRoomStore";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { CgSpinner } from "react-icons/cg";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import Loading from "@/app/loading";
import "@livekit/components-styles";
import LiveDebateStage from "../components/liveDebateStage";
import { RoomContext } from "@livekit/components-react";
import { useLiveJiggleMetrics } from "@/app/store/useLiveJiggleMetrics";
import NoData from "@/app/components/blocks/no-data";
import { PiNotepadFill } from "react-icons/pi";
import DebateResult from "../components/debateResult";

const INITIAL_GLOBAL_TIME = 600;
const INITIAL_TURN_TIME = 120;

function computeTimeLeft(
  anchor: string | null | undefined,
  totalSeconds: number,
  clockOffsetMs = 0,
): number {
  if (!anchor) return totalSeconds;
  const anchorMs = new Date(anchor).getTime();
  if (Number.isNaN(anchorMs)) return totalSeconds;
  const elapsedSec = Math.floor((Date.now() + clockOffsetMs - anchorMs) / 1000);
  return Math.max(0, totalSeconds - elapsedSec);
}

const GET_DEBATE_BY_ID = gql`
  query GetDebateById($id: ID!) {
    getDebateById(id: $id) {
      id
      title
      status
      startedAt
      turnStartedAt
      activeUserId
      participants {
        id
        userId
        role
        overallScore
        logicScore
        persuasionScore
        factCheckAccuracy
        feedbackSummary
        user {
          id
          name
          image
        }
        votesReceived {
          id
          voterId
        }
      }
    }
  }
`;

const VOTE_ON_DEBATE = gql`
  mutation voteOnDebate($debateId: ID!, $participantId: ID!) {
    voteOnDebate(debateId: $debateId, participantId: $participantId) {
      id
      participantId
    }
  }
`;

const RECORD_DEBATE_TURN = gql`
  mutation recordDebateTurn($debateId: ID!, $content: String!) {
    recordDebateTurn(debateId: $debateId, content: $content) {
      id
    }
  }
`;

const FINALIZE_DEBATE = gql`
  mutation finalizeDebate($debateId: ID!) {
    finalizeDebate(debateId: $debateId) {
      id
      status
      participants {
        id
        overallScore
        logicScore
        persuasionScore
        factCheckAccuracy
        feedbackSummary
      }
    }
  }
`;

export default function DebateArena() {
  const {
    subscribeToDebateRoom,
    unsubscribeFromDebateRoom,
    socket,
    votes,
    userVote,
    setVotes,
    setUserVote,
    spectatorCount,
    joinAudio,
    leaveAudio,
    livekitRoom,
    connectionState,
  } = useDebateRoom();

  const params = useParams();
  const roomId =
    typeof params?.debateId === "string" ? params.debateId : undefined;
  const { data: session } = useSession();
  const hasAutoPassedRef = useRef(false);
  const participantRoleRef = useRef<"debater" | "spectator" | null>(null);

  const [globalTimeLeft, setGlobalTimeLeft] =
    useState<number>(INITIAL_GLOBAL_TIME);
  const [turnTimeLeft, setTurnTimeLeft] = useState<number>(INITIAL_TURN_TIME);
  const [turnStartedAt, setTurnStartedAt] = useState<string | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery<{ getDebateById: any }>(
    GET_DEBATE_BY_ID,
    { variables: { id: roomId }, skip: !roomId, pollInterval: 4000 },
  );

  const [recordDebateTurn] = useMutation(RECORD_DEBATE_TURN);
  const [finalizeDebate] = useMutation(FINALIZE_DEBATE, {
    onError: (err) => console.error("Failed to finalize debate:", err),
  });
  const [voteOnDebate] = useMutation(VOTE_ON_DEBATE, {
    onError: (err) => console.error("Vote failed:", err),
  });
  const debate = data?.getDebateById;
  console.log("Debate data:", debate);
  const participants: any[] = debate?.participants ?? [];
  const creator = participants.find((p) => p.role === "Creator");
  const opponentRole = participants.find((p) => p.role === "Opponent");
  const isCurrentUser = creator?.userId === session?.user?.id;
  const isParticipant =
    isCurrentUser || opponentRole?.userId === session?.user?.id;
  const me = isCurrentUser ? creator : opponentRole;
  const opponent = isCurrentUser ? opponentRole : creator;
  const opponentJoined = !!opponent;
  const clockOffsetRef = useRef(0);

  useEffect(() => {
    if (!socket) return;
    const sync = () => {
      const sentAt = Date.now();
      socket.emit("debate:timeSync", sentAt, (serverTime: number) => {
        const rtt = Date.now() - sentAt;
        clockOffsetRef.current = serverTime + rtt / 2 - Date.now();
      });
    };
    sync();
    const interval = setInterval(sync, 30000);
    return () => clearInterval(interval);
  }, [socket]);

  const isDebateActive =
    debate?.status === "Waiting" || debate?.status === "Live";

  if (debate) {
    participantRoleRef.current = isParticipant ? "debater" : "spectator";
  }

  useEffect(() => {
    if (!participants.length) return;

    const tally: Record<string, number> = {};
    let myParticipantVote: string | null = null;

    for (const p of participants) {
      tally[p.id] = p.votesReceived?.length ?? 0;
      if (
        session?.user?.id &&
        p.votesReceived?.some((v: any) => v.voterId === session.user!.id)
      ) {
        myParticipantVote = p.id;
      }
    }

    setVotes(tally);
    setUserVote(myParticipantVote);
  }, [participants, session?.user?.id, setVotes, setUserVote]);

  useEffect(() => {
    if (debate?.startedAt) {
      setGlobalTimeLeft(computeTimeLeft(debate.startedAt, INITIAL_GLOBAL_TIME));
    }
    if (debate?.turnStartedAt) {
      setTurnStartedAt(debate.turnStartedAt);
      setTurnTimeLeft(computeTimeLeft(debate.turnStartedAt, INITIAL_TURN_TIME));
    }
    if (debate?.activeUserId) {
      setActiveUserId(debate.activeUserId);
    } else if (creator?.userId) {
      setActiveUserId((prev) => prev ?? creator.userId);
    }
  }, [
    debate?.startedAt,
    debate?.turnStartedAt,
    debate?.activeUserId,
    creator?.userId,
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (debate?.startedAt) {
        const remaining = computeTimeLeft(
          debate.startedAt,
          INITIAL_GLOBAL_TIME,
        );
        setGlobalTimeLeft(remaining);
        if (remaining === 0 && roomId && debate.status === "Live") {
          finalizeDebate({ variables: { debateId: roomId } });
        }
      }
      if (turnStartedAt) {
        setTurnTimeLeft(computeTimeLeft(turnStartedAt, INITIAL_TURN_TIME));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [debate?.startedAt, turnStartedAt, roomId, finalizeDebate]);

  const handlePassTurn = useCallback(() => {
    if (
      !isParticipant ||
      !socket ||
      !roomId ||
      !me?.userId ||
      !opponent?.userId
    ) {
      return;
    }

    socket.emit("debate:passTurn", {
      debateId: roomId,
      nextUserId: opponent.userId,
    });
  }, [isParticipant, socket, roomId, me?.userId, opponent?.userId]);

  useEffect(() => {
    if (turnTimeLeft > 0) {
      hasAutoPassedRef.current = false;
      return;
    }
    if (globalTimeLeft <= 0 || hasAutoPassedRef.current) return;
    hasAutoPassedRef.current = true;
    handlePassTurn();
  }, [turnTimeLeft, globalTimeLeft, handlePassTurn]);

  const handleVote = (choice: "me" | "opponent") => {
    const target = choice === "me" ? me : opponent;
    const targetParticipantId = target?.id;
    if (!targetParticipantId || !roomId || targetParticipantId === userVote)
      return;

    const previousVote = userVote;
    setUserVote(targetParticipantId);
    voteOnDebate({
      variables: { debateId: roomId, participantId: targetParticipantId },
    }).catch((err) => {
      console.error("Vote failed:", err);
      setUserVote(previousVote);
    });
  };

  useEffect(() => {
    if (!roomId || !session?.user?.id) return;
    subscribeToDebateRoom(roomId, session.user.id);
    return () => {
      unsubscribeFromDebateRoom(roomId);
    };
  }, [
    roomId,
    session?.user?.id,
    subscribeToDebateRoom,
    unsubscribeFromDebateRoom,
  ]);

  useEffect(() => {
    if (!roomId || !session?.user?.id || !isDebateActive) return;
    if (!participantRoleRef.current) return;

    joinAudio(roomId, session.user.id, participantRoleRef.current);
    return () => {
      leaveAudio();
    };
  }, [roomId, session?.user?.id, isDebateActive]);

  useEffect(() => {
    if (!socket) return;
    const onTurnChanged = ({
      nextUserId,
      turnStartedAt,
    }: {
      nextUserId: string;
      turnStartedAt: string;
    }) => {
      setActiveUserId(nextUserId);
      setTurnStartedAt(turnStartedAt);
    };

    const onOpponentJoined = () => {
      refetch();
    };

    const onDebateCancelled = () => {
      refetch();
    };

    socket.on("debate:turnChanged", onTurnChanged);
    socket.on("debate:opponentJoined", onOpponentJoined);
    socket.on("debate:cancelled", onDebateCancelled);

    return () => {
      socket.off("debate:turnChanged", onTurnChanged);
      socket.off("debate:opponentJoined", onOpponentJoined);
      socket.off("debate:cancelled", onDebateCancelled);
    };
  }, [socket, refetch]);

  const handleTurnRecorded = useCallback(
    (text: string) => {
      if (!roomId || !text) return;
      recordDebateTurn({
        variables: { debateId: roomId, content: text },
      }).catch((err) => console.error("Failed to record turn:", err));
    },
    [roomId, recordDebateTurn],
  );

  const meFinal: DebateMetrics | null =
    me?.overallScore != null
      ? {
          overallScore: me.overallScore,
          logicScore: me.logicScore,
          persuasionScore: me.persuasionScore,
          factCheckAccuracy: me.factCheckAccuracy,
        }
      : null;

  const opponentFinal: DebateMetrics | null =
    opponent?.overallScore != null
      ? {
          overallScore: opponent.overallScore,
          logicScore: opponent.logicScore,
          persuasionScore: opponent.persuasionScore,
          factCheckAccuracy: opponent.factCheckAccuracy,
        }
      : null;

  const isMyTurnNow = activeUserId === me?.userId;
  const isOpponentTurnNow = activeUserId === opponent?.userId;

  const meMetrics = useLiveJiggleMetrics(isDebateActive, isMyTurnNow, meFinal);
  const opponentMetrics = useLiveJiggleMetrics(
    isDebateActive,
    isOpponentTurnNow,
    opponentFinal,
  );

  if (loading && !debate) return <Loading />;

  return (
    <main className="min-h-screen text-foreground pt-20 p-6 space-y-6 w-full">
      <DebateHeader
        topic={debate?.title ?? ""}
        globalTimeLeft={globalTimeLeft}
        spectatorCount={spectatorCount}
        status={debate?.status ?? "Waiting"}
        debateId={debate?.id ?? ""}
      />

      {isDebateActive ? (
        connectionState === "connected" && livekitRoom ? (
          <RoomContext.Provider value={livekitRoom}>
            <LiveDebateStage
              me={me}
              opponent={opponent}
              isParticipant={isParticipant}
              opponentJoined={opponentJoined}
              activeUserId={activeUserId}
              turnTimeLeft={turnTimeLeft}
              onPassTurn={handlePassTurn}
              onTurnRecorded={handleTurnRecorded}
            />
          </RoomContext.Provider>
        ) : (
          <div className="flex items-center justify-center h-80">
            <CgSpinner className="w-20 h-20 animate-spin text-primary" />
          </div>
        )
      ) : (
        <DebateResult
          totalVotes={Object.values(votes).reduce((a, b) => a + b, 0)}
          participants={[
            {
              name: me?.user?.name ?? "You",
              image: me?.user?.image ?? "",
              votes: votes[me?.id ?? ""] ?? 0,
            },
            {
              name: opponent?.user?.name ?? "Opponent",
              image: opponent?.user?.image ?? "",
              votes: votes[opponent?.id ?? ""] ?? 0,
            },
          ]}
        />
      )}

      {opponentJoined && debate?.status === "Live" && (
        <VotingSection
          debater1Name={me?.user?.name}
          debater2Name={opponent?.user?.name}
          votes1={votes[me?.id ?? ""] ?? 0}
          votes2={votes[opponent?.id ?? ""] ?? 0}
          userVote={
            userVote === me?.id
              ? "me"
              : userVote === opponent?.id
                ? "opponent"
                : null
          }
          onVote={handleVote}
        />
      )}

      {opponentJoined &&
        (debate?.status != "Cancelled" ? (
          <div>
            <AIAnalyticsDashboard
              debater1Name={me?.user?.name}
              debater2Name={opponent?.user?.name}
              debater1Metrics={meMetrics}
              debater2Metrics={opponentMetrics}
            />
            <div className="mt-4 p-4 bg-muted/20 backdrop-blur-lg rounded-xl border border-primary/10">
              <h3 className="text-sm font-semibold text-accent mb-2 font-montserrat">
                <PiNotepadFill className="inline-block mr-2 size-4" />
                Feedback Summary
              </h3>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="bg-muted/50 p-4 rounded-lg border border-primary/20">
                  {me?.feedbackSummary ? (
                    <p className="text-sm text-secondary font-poppins">
                      <span className="font-bold text-primary">
                        {me.user?.name}
                      </span>{" "}
                      <br />
                      {me.feedbackSummary}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground font-poppins">
                      No feedback available.
                    </p>
                  )}
                </div>
                <div className="bg-muted/50 p-4 rounded-lg border border-primary/20">
                  {opponent?.feedbackSummary ? (
                    <p className="text-sm text-secondary font-poppins">
                      <span className="font-bold text-primary">
                        {opponent.user?.name}
                      </span>{" "}
                      <br />
                      {opponent.feedbackSummary}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground font-poppins">
                      No feedback available.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col justify-center items-center p-6 h-60 rounded-xl border transition-all duration-300 bg-muted/20 backdrop-blur-lg font-poppins border-primary/10">
            <NoData
              title="Debate was cancelled !"
              description="The debate has been cancelled and analytics are not available for cancelled debates."
            />
          </div>
        ))}
    </main>
  );
}
