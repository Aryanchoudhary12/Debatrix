"use client";
import { CgSpinner } from "react-icons/cg";
import DebaterCard from "./UserCard";
import {
  useParticipants,
  useLocalParticipant,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { useEffect, useRef, useState } from "react";
import { useAudioCapture } from "@/app/store/audioCaptureStore";
import { Track } from "livekit-client";
export default function LiveDebateStage({
  me,
  opponent,
  isParticipant,
  opponentJoined,
  activeUserId,
  turnTimeLeft,
  onPassTurn,
  onTurnRecorded,
}: {
  me: any;
  opponent: any;
  isParticipant: boolean;
  opponentJoined: boolean;
  activeUserId: string | null;
  turnTimeLeft: number;
  onPassTurn: () => void;
  onTurnRecorded: (text: string) => void;
}) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const [manuallyMuted, setManuallyMuted] = useState(false);
  const { startRecording, stopAndTranscribe } = useAudioCapture();
  const meParticipant = participants.find((p) => p.identity === me?.userId);
  const opponentParticipant = participants.find(
    (p) => p.identity === opponent?.userId,
  );

  const isMyTurn = isParticipant && activeUserId === me?.userId;
  const shouldMicBeEnabled = isMyTurn && !manuallyMuted;
  const appliedRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (!isParticipant || !localParticipant) return;
    if (appliedRef.current === shouldMicBeEnabled) return;

    appliedRef.current = shouldMicBeEnabled;
    localParticipant
      .setMicrophoneEnabled(shouldMicBeEnabled)
      .then(() => {
        if (shouldMicBeEnabled) {
          const micPub = localParticipant.getTrackPublication(
            Track.Source.Microphone,
          );
          const mediaTrack = micPub?.track?.mediaStreamTrack;
          if (mediaTrack) {
            startRecording(new MediaStream([mediaTrack]));
          } else {
            console.warn(
              "[audio-capture] mic enabled but no track publication found yet — turn will not be recorded",
            );
          }
        } else {
          stopAndTranscribe().then((text) => {
            if (text) onTurnRecorded(text);
          });
        }
      })
      .catch((err) =>
        console.error("[livekit] failed to set microphone state:", err),
      );
  }, [
    shouldMicBeEnabled,
    isParticipant,
    localParticipant,
    startRecording,
    stopAndTranscribe,
    onTurnRecorded,
  ]);

  const prevIsMyTurnRef = useRef(isMyTurn);
  useEffect(() => {
    if (isMyTurn && !prevIsMyTurnRef.current) {
      setManuallyMuted(false);
    }
    prevIsMyTurnRef.current = isMyTurn;
  }, [isMyTurn]);

  const toggleMute = async () => {
    if (!isMyTurn) return;
    setManuallyMuted((prev) => !prev);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <DebaterCard
        name={me?.user?.name ?? "You"}
        title={me?.role ?? ""}
        avatarUrl={me?.user?.image ?? ""}
        isActive={activeUserId === me?.userId}
        turnTimeLeft={turnTimeLeft}
        isSpeaking={!!meParticipant?.isSpeaking}
        isLocal={isParticipant}
        isMuted={!shouldMicBeEnabled}
        onToggleMute={isParticipant && isMyTurn ? toggleMute : undefined}
        onPassTurn={onPassTurn}
      />

      {opponentJoined ? (
        <DebaterCard
          name={opponent?.user?.name ?? "Opponent"}
          title={opponent?.role ?? ""}
          avatarUrl={opponent?.user?.image ?? ""}
          isActive={activeUserId === opponent?.userId}
          turnTimeLeft={turnTimeLeft}
          isSpeaking={!!opponentParticipant?.isSpeaking}
          isLocal={false}
          onPassTurn={() => undefined}
        />
      ) : (
        <div className="relative flex flex-col justify-center items-center p-5 rounded-xl border transition-all duration-300 bg-muted/50 backdrop-blur-lg font-poppins border-primary/10 aspect-video md:aspect-auto">
          <CgSpinner className="w-8 h-8 animate-spin text-primary mb-2" />
          <span className="text-sm text-secondary font-medium">
            Waiting for opponent to join...
          </span>
        </div>
      )}

      <RoomAudioRenderer />
    </div>
  );
}
