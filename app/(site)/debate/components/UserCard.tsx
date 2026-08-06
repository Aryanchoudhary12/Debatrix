"use client";
import Button from "@/app/components/ui/button";
import { FaMicrophone } from "react-icons/fa";
import { IoMicOff, IoMic } from "react-icons/io5";
import Avatar from "@/app/components/ui/avatarProvider";

export interface DebaterCardProps {
  name: string;
  title: string;
  avatarUrl: string;
  isActive: boolean;
  turnTimeLeft: number;
  isSpeaking: boolean;
  isLocal: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onPassTurn: () => void | undefined;
}

export default function DebaterCard({
  name,
  title,
  avatarUrl,
  isActive,
  turnTimeLeft,
  isSpeaking,
  isLocal,
  isMuted,
  onToggleMute,
  onPassTurn,
}: DebaterCardProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const turnProgress = (turnTimeLeft / 120) * 100;

  return (
    <div
      className={`relative flex flex-col justify-between p-5 rounded-xl border transition-all duration-300 bg-muted/50 backdrop-blur-lg font-poppins ${
        isActive
          ? "border-primary/50 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-2 ring-primary/10"
          : "border-primary/10"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isActive ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-accent text-muted rounded-full">
              <FaMicrophone
                className={`w-3.5 h-3.5 ${isSpeaking ? "animate-pulse" : ""}`}
              />{" "}
              Speaking
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-muted text-secondary rounded-full border border-primary/20">
              <IoMicOff className="w-3.5 h-3.5" /> Waiting
            </span>
          )}
        </div>

        {isActive && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-secondary font-medium">Turn:</span>
            <span className="font-mono text-sm font-bold text-accent">
              {formatTime(turnTimeLeft)}
            </span>
          </div>
        )}
      </div>

      {isActive && (
        <div className="w-full bg-secondary/20 h-1.5 rounded-full overflow-hidden mb-2 backdrop-blur-lg">
          <div
            className="bg-primary h-full transition-all duration-1000 ease-linear"
            style={{ width: `${turnProgress}%` }}
          />
        </div>
      )}
      <div
        className={`relative w-full aspect-video rounded-lg overflow-hidden bg-blue-300/20 border flex items-center justify-center mb-2 transition-colors ${
          isSpeaking ? "border-green-500/60" : "border-primary/10"
        }`}
      >
        <div className="flex flex-col gap-4 items-center justify-center p-6 text-center">
          <Avatar
            src={avatarUrl}
            username={name}
            size="xl"
            className={`rounded-xl ${isSpeaking ? "ring-4 ring-green-500/50" : ""}`}
          />
          <span className="text-xs text-secondary font-medium">
            {isSpeaking ? "Speaking now" : "Audio only"}
          </span>
        </div>

        {isLocal && onToggleMute && (
          <Button
            onClick={onToggleMute}
            className="absolute! bottom-3 right-3"
            title={isMuted ? "Unmute mic" : "Mute mic"}
          >
            {isMuted ? (
              <IoMicOff className="w-4 h-4" />
            ) : (
              <IoMic className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      <div className="flex items-end justify-between mt-auto pt-2">
        <div>
          <h3 className="text-lg font-bold text-accent flex items-center gap-1.5">
            {name}
          </h3>
          <p className="text-xs text-secondary font-medium">{title}</p>
        </div>

        {isActive && isLocal && (
          <Button onClick={onPassTurn} variant="outline" className="rounded-md">
            Pass Turn
          </Button>
        )}
      </div>
    </div>
  );
}
