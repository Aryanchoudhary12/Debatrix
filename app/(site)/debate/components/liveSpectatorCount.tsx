// components/LiveSpectatorCount.tsx
"use client";
import { useEffect, useState } from "react";
import { useDebateRoom } from "@/app/store/debateRoomStore";

interface Props {
  debateId: string;
  status: "Waiting" | "Live" | "Completed" | "Cancelled";
  fallbackCount: number; 
}

export function LiveSpectatorCount({ debateId, status, fallbackCount }: Props) {
  const { socket } = useDebateRoom();
  const [liveCount, setLiveCount] = useState<number>(fallbackCount);

  useEffect(() => {
    if (!socket || status === "Completed" || status === "Cancelled") return;

    socket.emit("debate:join", debateId);

    const onCount = ({ count }: { count: number }) => setLiveCount(count);
    socket.on("debate:spectatorCount", onCount);

    return () => {
      socket.emit("debate:leave", debateId);
      socket.off("debate:spectatorCount", onCount);
    };
  }, [socket, debateId, status]);

  const display = status === "Completed" ? fallbackCount : liveCount;

  return <>{display}</>;
}