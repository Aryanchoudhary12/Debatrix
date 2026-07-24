"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSpeechCapture } from "@/app/store/speechStore";
import DebateHeader from "../components/DebateHeader";
import DebaterCard from "../components/UserCard";
import VotingSection from "../components/VotingSection";
import AIAnalyticsDashboard, {
  DebateMetrics,
} from "../components/AIAnalyticsDashboard";
import { useDebateRoom } from "@/app/store/debateRoomStore";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import OpponentCard from "../components/opponentCard";
import { CgSpinner } from "react-icons/cg";
import peer from "@/app/service/peer";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import Loading from "@/app/loading";
import { SquigglyText } from "@/app/components/ui/squiggly-text";

const INITIAL_GLOBAL_TIME = 900;
const INITIAL_TURN_TIME = 120;

function computeTimeLeft(
  anchor: string | null | undefined,
  totalSeconds: number,
): number {
  if (!anchor) return totalSeconds;
  const elapsedSec = Math.floor(
    (Date.now() - new Date(anchor).getTime()) / 1000,
  );
  return Math.max(0, totalSeconds - elapsedSec);
}

const GET_DEBATE_BY_ID = gql`
  query GetDebateById($id: ID!) {
    getDebateById(id: $id) {
      id
      title
      voteCountUser1
      voteCountUser2
      startedAt
      turnStartedAt
      activeUserId
      CurrentUser {
        id
        name
        image
      }
      Opponent {
        id
        name
        image
      }
      status
    }
  }
`;
const VOTE_ON_DEBATE = gql`
  mutation voteOnDebate(
    $debateId: ID!
    $votedForUserId: String!
    $previousVoteUserId: String
  ) {
    voteOnDebate(
      debateId: $debateId
      votedForUserId: $votedForUserId
      previousVoteUserId: $previousVoteUserId
    ) {
      id
      voteCountUser1
      voteCountUser2
    }
  }
`;

const RECORD_DEBATE_TURN = gql`
  mutation recordDebateTurn(
    $debateId: ID!
    $content: String!
    $turnIndex: Int!
  ) {
    recordDebateTurn(
      debateId: $debateId
      content: $content
      turnIndex: $turnIndex
    ) {
      id
    }
  }
`;

const FINALIZE_DEBATE = gql`
  mutation finalizeDebate($debateId: ID!) {
    finalizeDebate(debateId: $debateId) {
      id
      status
    }
  }
`;

export default function DebateArena() {
  const {
    subscribeToDebateRoom,
    unsubscribeFromDebateRoom,
    socket,
    sendIceCandidate,
    votes,
    userVote,
    setVotes,
    setUserVote,
    subscribeToVotes,
    spectatorCount,
    broadcastVoteUpdate,
  } = useDebateRoom();
  const params = useParams();
  const roomId =
    typeof params?.debateId === "string" ? params.debateId : undefined;
  const { data: session } = useSession();
  const {
    isListening,
    start: startListening,
    flushTurnText,
  } = useSpeechCapture();
  const turnIndexRef = useRef(0);

  const [globalTimeLeft, setGlobalTimeLeft] =
    useState<number>(INITIAL_GLOBAL_TIME);
  const [turnTimeLeft, setTurnTimeLeft] = useState<number>(INITIAL_TURN_TIME);
  const [turnStartedAt, setTurnStartedAt] = useState<string | null>(null);
  const [finalScores, setFinalScores] = useState<{
    user1: DebateMetrics & { feedbackSummary: string };
    user2: DebateMetrics & { feedbackSummary: string };
  } | null>(null);

  const { data, refetch, loading } = useQuery<{ getDebateById: any }>(
    GET_DEBATE_BY_ID,
    {
      variables: { id: roomId },
      skip: !roomId,
    },
  );

  const [recordDebateTurn] = useMutation(RECORD_DEBATE_TURN);

  const [finalizeDebate] = useMutation(FINALIZE_DEBATE, {
    onCompleted: (data: any) => {
      if (data.finalizeDebate.user1Score && data.finalizeDebate.user2Score) {
        setFinalScores({
          user1: data.finalizeDebate.user1Score,
          user2: data.finalizeDebate.user2Score,
        });
      }
    },
  });
  const [voteOnDebate] = useMutation(VOTE_ON_DEBATE, {
    onCompleted: (data: any) => {
      const { voteCountUser1, voteCountUser2 } = data.voteOnDebate;
      setVotes(voteCountUser1, voteCountUser2);
      if (roomId) broadcastVoteUpdate(roomId, voteCountUser1, voteCountUser2);
    },
    onError: (err) => {
      console.error("Vote failed:", err);
    },
  });

  const debate = data?.getDebateById;
  const isCurrentUser: boolean = debate?.CurrentUser?.id === session?.user?.id;
  const isParticipant: boolean =
    debate?.CurrentUser?.id === session?.user?.id ||
    debate?.Opponent?.id === session?.user?.id;
  const me = isCurrentUser ? debate?.CurrentUser : debate?.Opponent;
  const opponent = isCurrentUser ? debate?.Opponent : debate?.CurrentUser;
  const [videoState, setVideoState] = useState<{
    me: boolean;
    opponent: boolean;
  }>({
    me: false,
    opponent: false,
  });
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [opponentSocketId, setOpponentSocketId] = useState<string | null>(null);

  useEffect(() => {
    if (debate?.voteCountUser1 != null && debate?.voteCountUser2 != null) {
      setVotes(debate.voteCountUser1, debate.voteCountUser2);
    }
  }, [debate?.voteCountUser1, debate?.voteCountUser2, setVotes]);

  useEffect(() => {
    subscribeToVotes();
  }, [subscribeToVotes]);

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
    }
  }, [debate?.startedAt, debate?.turnStartedAt, debate?.activeUserId]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (debate?.startedAt) {
        setGlobalTimeLeft(
          computeTimeLeft(debate.startedAt, INITIAL_GLOBAL_TIME),
        );
      }
      if (turnStartedAt) {
        setTurnTimeLeft(computeTimeLeft(turnStartedAt, INITIAL_TURN_TIME));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [debate?.startedAt, turnStartedAt]);

  useEffect(() => {
    if (!socket) return;

    const onUserJoined = async (payload: {
      userId: string;
      socketId: string;
    }) => {
      setOpponentSocketId(payload.socketId);
      refetch();
      peer.setRole(true);
      const offer = await peer.getOffer();
      if (offer) socket.emit("user:call", { to: payload.socketId, offer });
    };

    const onIncomingCall = async ({
      from,
      offer,
    }: {
      from: string;
      offer: any;
    }) => {
      setOpponentSocketId(from);
      const answer = peer.hasConnection?.()
        ? await peer.getRenegotiationAnswer(offer)
        : await peer.getAnswer(offer);
      if (answer) socket.emit("call:accepted", { to: from, answer });
    };

    const onCallAccepted = async ({ answer }: { answer: any }) => {
      await peer.setRemoteAnswer(answer);
    };

    const onIceCandidate = ({
      candidate,
    }: {
      candidate: RTCIceCandidateInit;
    }) => {
      peer.addIceCandidate(candidate);
    };

    socket.on("userJoined", onUserJoined);
    socket.on("incoming:call", onIncomingCall);
    socket.on("call:accepted", onCallAccepted);
    socket.on("ice-candidate", onIceCandidate);

    return () => {
      socket.off("userJoined", onUserJoined);
      socket.off("incoming:call", onIncomingCall);
      socket.off("call:accepted", onCallAccepted);
      socket.off("ice-candidate", onIceCandidate);
    };
  }, [socket, refetch]);

  useEffect(() => {
    peer.onNegotiationNeeded((offer) => {
      if (socket && opponentSocketId) {
        socket.emit("user:call", { to: opponentSocketId, offer });
      }
    });
  }, [socket, opponentSocketId]);

  useEffect(() => {
    peer.onTrack((stream) => setRemoteStream(stream));
    peer.onIceCandidate((candidate) => {
      if (opponentSocketId) sendIceCandidate(opponentSocketId, candidate);
    });
  }, [opponentSocketId, sendIceCandidate]);

  const handleLocalStream = useCallback((stream: MediaStream) => {
    peer.setLocalStream(stream);
  }, []);

  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  useEffect(() => {
    if (debate?.CurrentUser?.id && activeUserId === null) {
      setActiveUserId(debate.CurrentUser.id);
    }
  }, [debate?.CurrentUser?.id, activeUserId]);

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
    socket.on("debate:turnChanged", onTurnChanged);
    return () => {
      socket.off("debate:turnChanged", onTurnChanged);
    };
  }, [socket]);

  const handlePassTurn = useCallback(() => {
    if (!isParticipant) return;
    if (!socket || !roomId || !me?.id || !opponent?.id) return;
    const turnText = flushTurnText();
    if (turnText) {
      recordDebateTurn({
        variables: {
          debateId: roomId,
          content: turnText,
          turnIndex: turnIndexRef.current++,
        },
      }).catch((err) => console.error("Failed to record turn:", err));
    }

    const nextUserId = opponent.id;
    socket.emit("debate:passTurn", { debateId: roomId, nextUserId });
  }, [
    isParticipant,
    socket,
    roomId,
    me?.id,
    opponent?.id,
    activeUserId,
    flushTurnText,
    recordDebateTurn,
  ]);

  const activeDebater: "me" | "opponent" =
    activeUserId === me?.id ? "me" : "opponent";

  const handleToggleVideo = (side: "me" | "opponent") => {
    if (!isParticipant || side !== "me") return;
    setVideoState((prev) => {
      const next = { ...prev, me: !prev.me };
      if (socket && roomId && session?.user?.id) {
        socket.emit("debate:videoToggle", {
          debateId: roomId,
          userId: session.user.id,
          isVideoOn: next.me,
        });
      }
      return next;
    });
  };

  useEffect(() => {
    if (!socket) return;
    const onVideoToggled = ({
      isVideoOn,
    }: {
      userId: string;
      isVideoOn: boolean;
    }) => {
      setVideoState((prev) => ({ ...prev, opponent: isVideoOn }));
    };
    socket.on("debate:videoToggled", onVideoToggled);
    return () => {
      socket.off("debate:videoToggled", onVideoToggled);
    };
  }, [socket]);

  const handleVote = (choice: "me" | "opponent") => {
    const targetUserId = choice === "me" ? me?.id : opponent?.id;
    if (!targetUserId || !roomId) return;

    voteOnDebate({
      variables: {
        debateId: roomId,
        votedForUserId: targetUserId,
        previousVoteUserId: userVote,
      },
    });
    setUserVote(userVote === targetUserId ? null : targetUserId);
  };
  const hasAutoPassedRef = useRef(false);
  useEffect(() => {
    if (turnTimeLeft > 0) {
      hasAutoPassedRef.current = false;
      return;
    }
    if (globalTimeLeft <= 0) return;
    if (hasAutoPassedRef.current) return;
    hasAutoPassedRef.current = true;
    handlePassTurn();
  }, [turnTimeLeft, globalTimeLeft, handlePassTurn]);
  useEffect(() => {
    if (turnTimeLeft <= 0 && globalTimeLeft > 0) handlePassTurn();
  }, [turnTimeLeft, globalTimeLeft, handlePassTurn]);

  useEffect(() => {
    if (!roomId || !session?.user?.id) {
      return;
    }
    subscribeToDebateRoom(roomId, session.user.id);
    return () => {
      unsubscribeFromDebateRoom(roomId);
      peer.closeConnection();
    };
  }, [
    roomId,
    session?.user?.id,
    subscribeToDebateRoom,
    unsubscribeFromDebateRoom,
  ]);

  const opponentJoined = !!opponent;
  useEffect(() => {
    if (opponentJoined && !isListening) {
      startListening();
    }
  }, [opponentJoined, isListening, startListening]);

  useEffect(() => {
    if (globalTimeLeft === 0 && roomId) {
      const turnText = flushTurnText();
      const finalize = async () => {
        if (turnText) {
          await recordDebateTurn({
            variables: {
              debateId: roomId,
              content: turnText,
              turnIndex: turnIndexRef.current++,
            },
          }).catch((err) => console.error("Failed to record final turn:", err));
        }
        finalizeDebate({ variables: { debateId: roomId } }).catch((err) =>
          console.error("Failed to finalize debate:", err),
        );
      };
      finalize();
    }
  }, [globalTimeLeft, roomId, flushTurnText, recordDebateTurn, finalizeDebate]);

  if (loading) return <Loading />;
  return (
    <main className="min-h-screen text-foreground pt-20 p-6 space-y-6 w-full">
      <DebateHeader
        topic={debate?.title ?? ""}
        globalTimeLeft={globalTimeLeft}
        spectatorCount={spectatorCount}
      />

      {debate.status === "Waiting" || debate.status === "Live" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isParticipant ? (
            <DebaterCard
              name={me?.name}
              title="You"
              avatarUrl={me?.image}
              isActive={activeDebater === "me"}
              turnTimeLeft={turnTimeLeft}
              isVideoOn={videoState.me}
              onToggleVideo={() => handleToggleVideo("me")}
              onPassTurn={handlePassTurn}
              onLocalStream={handleLocalStream}
            />
          ) : (
            <OpponentCard
              name={debate?.CurrentUser?.name}
              title="Debater 1"
              avatarUrl={debate?.CurrentUser?.image}
              isActive={activeUserId === debate?.CurrentUser?.id}
              turnTimeLeft={turnTimeLeft}
              isVideoOn={false}
              remoteStream={null}
            />
          )}
          {opponentJoined ? (
            <OpponentCard
              name={isParticipant ? opponent!.name : debate?.Opponent?.name}
              title={isParticipant ? "Opponent" : "Debater 2"}
              avatarUrl={
                isParticipant ? opponent!.image : debate?.Opponent?.image
              }
              isActive={
                isParticipant
                  ? activeDebater === "opponent"
                  : activeUserId === debate?.Opponent?.id
              }
              turnTimeLeft={turnTimeLeft}
              isVideoOn={videoState.opponent}
              remoteStream={remoteStream}
            />
          ) : (
            <div className="relative flex flex-col justify-center items-center p-5 rounded-xl border transition-all duration-300 bg-muted/50 backdrop-blur-lg font-poppins border-primary/10 aspect-video md:aspect-auto">
              <CgSpinner className="w-8 h-8 animate-spin text-primary mb-2" />
              <span className="text-sm text-secondary font-medium">
                Waiting for opponent to join...
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="relative flex flex-col justify-center items-center p-6 h-80 rounded-xl border transition-all duration-300 bg-muted/50 backdrop-blur-lg font-poppins border-primary/10 ">
          <SquigglyText
            stepDuration={70}
            scale={[6, 9]}
            className="text-amber-500 font-montserrat font-extrabold text-3xl md:text-4xl"
          >
            Debate Over !
          </SquigglyText>{" "}
          <p className="text-accent mt-4 font-poppins text-center text-sm font-medium max-w-lg">
            The debate has concluded and the final scores have been calculated.
            You can now view the AI analytics and audience voting results below.
          </p>
        </div>
      )}
      {opponentJoined && debate.status === "Live" && (
        <VotingSection
          debater1Name={me.name}
          debater2Name={opponent?.name}
          votes1={isCurrentUser ? votes.user1 : votes.user2}
          votes2={isCurrentUser ? votes.user2 : votes.user1}
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
      {opponentJoined && (
        <AIAnalyticsDashboard
          debater1Name={me?.name}
          debater2Name={opponent!.name}
          debater1Metrics={
            finalScores
              ? isCurrentUser
                ? finalScores.user1
                : finalScores.user2
              : {
                  overallScore: 0,
                  logicScore: 0,
                  persuasionScore: 0,
                  factCheckAccuracy: 0,
                }
          }
          debater2Metrics={
            finalScores
              ? isCurrentUser
                ? finalScores.user2
                : finalScores.user1
              : {
                  overallScore: 0,
                  logicScore: 0,
                  persuasionScore: 0,
                  factCheckAccuracy: 0,
                }
          }
        />
      )}
    </main>
  );
}
