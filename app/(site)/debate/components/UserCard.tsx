"use client";

import { useCallback, useEffect, useRef } from "react";
import Button from "@/app/components/ui/button";
import { FaMicrophone, FaVideo, FaVideoSlash } from "react-icons/fa";
import { IoMicOff } from "react-icons/io5";
import peer from "@/app/service/peer";
import Avatar from "@/app/components/ui/avatarProvider";
export interface DebaterCardProps {
  name: string;
  title: string;
  avatarUrl: string;
  isActive: boolean;
  turnTimeLeft: number;
  isVideoOn: boolean;
  onToggleVideo: () => void;
  onPassTurn: () => void;
  onLocalStream: (stream: MediaStream) => void;
}
export default function DebaterCard({
  name,
  title,
  avatarUrl,
  isActive,
  turnTimeLeft,
  isVideoOn,
  onToggleVideo,
  onPassTurn,
  onLocalStream,
}: DebaterCardProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const turnProgress = (turnTimeLeft / 120) * 100;
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  useEffect(() => {
    let cancelled = false;

    const acquireMedia = async () => {
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch (err) {
        console.warn("No camera available, falling back to audio-only:", err);
        try {
          return await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (audioErr) {
          console.warn("No microphone available either:", audioErr);
          return null;
        }
      }
    };
    (async () => {
      const s = await acquireMedia();
      if (!s) return;
      if (cancelled) {
        s.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
      onLocalStream(s);
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [onLocalStream]);

  useEffect(() => {
    if (isVideoOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isVideoOn]);

  useEffect(() => {
    peer.toggleTrack("video", isVideoOn);
  }, [isVideoOn]);
  return (
    <div
      className={`relative flex flex-col justify-between p-5 rounded-xl border transition-all duration-300 bg-muted/50 backdrop-blur-lg font-poppins ${
        isActive
          ? "border-primary/50 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-2 ring-primary/10"
          : "border-primary/10 "
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isActive ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-accent text-muted rounded-full">
              <FaMicrophone className="w-3.5 h-3.5 animate-pulse" /> Speaking
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

      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-blue-300/20 border border-primary/10 flex items-center justify-center mb-2">
        {isVideoOn && isActive ? (
          <div className="relative w-full h-full  flex flex-col items-center justify-center">
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded text-[10px] text-white tracking-wider font-mono uppercase">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />{" "}
              Live Feed
            </div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="relative h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4 items-center justify-center p-6 text-center animate-fade-in">
            <Avatar src={avatarUrl} username={name} size="xl" className="rounded-xl" />
            <span className="text-xs text-secondary font-medium">
              Camera Disabled • Using Avatar
            </span>
          </div>
        )}

        {isActive && (
          <Button
            onClick={onToggleVideo}
            className="absolute! bottom-3 right-3"
            title={isVideoOn ? "Turn Video Off" : "Turn Video On"}
          >
            {isVideoOn ? (
              <FaVideo className="w-4 h-4 " />
            ) : (
              <FaVideoSlash className="w-4 h-4 " />
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

        {isActive && (
          <Button onClick={onPassTurn} variant="outline">
            Pass Turn
          </Button>
        )}
      </div>
    </div>
  );
}
