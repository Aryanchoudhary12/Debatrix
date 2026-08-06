"use client";
import { create } from "zustand";
import io from "socket.io-client";
import type { Socket } from "socket.io-client";
import { Room, RoomEvent } from "livekit-client";

interface DebateRoomStore {
  currentDebateId: string | null;
  spectatorCount: number;
  socket: Socket | null;
  _joinToken?: symbol | null;
  votes: Record<string, number>;
  userVote: string | null;
  livekitRoom: Room | null;
  connectionState: "idle" | "connecting" | "connected" | "error";
  setVotes: (votes: Record<string, number>) => void;
  setUserVote: (participantId: string | null) => void;
  subscribeToDebateRoom: (roomId: string, userId: string) => void;
  unsubscribeFromDebateRoom: (roomId: string) => void;
  joinAudio: (
    roomId: string,
    identity: string,
    role: "debater" | "spectator",
  ) => Promise<void>;
  leaveAudio: () => Promise<void>;
}

const URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/debate`
  : "http://localhost:3000/debate";

export const useDebateRoom = create<DebateRoomStore>((set, get) => ({
  currentDebateId: null,
  spectatorCount: 0,
  socket: null,
  _joinToken: null,
  votes: {},
  userVote: null,
  livekitRoom: null,
  connectionState: "idle",
  setVotes: (votes) => set({ votes }),
  setUserVote: (participantId) => set({ userVote: participantId }),
  subscribeToDebateRoom: (roomId, userId) => {
    let socket = get().socket;
    if (!socket) {
      socket = io(URL, { query: { userId } });
      set({ socket });
    }
    if (get().currentDebateId === roomId) return;
    const previous = get().currentDebateId;
    if (previous) get().unsubscribeFromDebateRoom(previous);
    socket.off("debate:spectatorCount");
    socket.off("debate:votesUpdated");
    socket.on("debate:spectatorCount", ({ count }: { count: number }) => {
      set({ spectatorCount: count });
    });
    socket.on(
      "debate:votesUpdated",
      ({ votes }: { votes: Record<string, number> }) => {
        set({ votes });
      },
    );
    socket.emit("debate:join", roomId);
    set({ currentDebateId: roomId });
  },
  unsubscribeFromDebateRoom: (roomId) => {
    const socket = get().socket;
    if (!socket) return;
    socket.emit("debate:leave", roomId);
    socket.off("debate:spectatorCount");
  },
  joinAudio: async (roomId, identity, role) => {
    const callId = Symbol();
    set({ connectionState: "connecting", _joinToken: callId } as any);
    try {
      const res = await fetch(
        `/api/livekit-token?room=${roomId}&identity=${identity}&role=${role}`,
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Token fetch failed (${res.status}): ${text.slice(0, 200)}`,
        );
      }
      const { token, url } = await res.json();
      if (get()._joinToken !== callId) return;
      const room = new Room({ adaptiveStream: true, dynacast: true });
      await room.connect(url, token);
      if (get()._joinToken !== callId) {
        await room.disconnect();
        return;
      }
      if (role === "debater") {
        await room.localParticipant.setMicrophoneEnabled(true);
      }
      room.on(RoomEvent.Disconnected, () => {
        if (get()._joinToken === callId) {
          set({ connectionState: "idle", livekitRoom: null });
        }
      });
      set({ livekitRoom: room, connectionState: "connected" });
    } catch (err) {
      if (get()._joinToken === callId) {
        console.error("[livekit] join failed:", err);
        set({ connectionState: "error" });
      }
    }
  },
  leaveAudio: async () => {
    set({ _joinToken: null } as any);
    const room = get().livekitRoom;
    if (room) {
      await room.disconnect();
    }
    set({ livekitRoom: null, connectionState: "idle" });
  },
}));
