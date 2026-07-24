"use client";
import { create } from "zustand";
import io from "socket.io-client";
import type { Socket } from "socket.io-client";
import peer from "@/app/service/peer";
interface DebateRoomStore {
  currentDebateId: string | null;
  usersInRoom: string[];
  spectatorCount: number;
  socket: Socket | null;
  votes: { user1: number; user2: number };
  userVote: string | null;
  setVotes: (voteCountUser1: number, voteCountUser2: number) => void;
  setUserVote: (userId: string | null) => void;
  subscribeToDebateRoom: (roomId: string, userId: string) => void;
  unsubscribeFromDebateRoom: (roomId: string) => void;
  handleCallUser: (socketId: any) => void;
  sendIceCandidate: (to: string, candidate: RTCIceCandidate) => void;
  subscribeToVotes: () => void;
  broadcastVoteUpdate: (
    debateId: string,
    voteCountUser1: number,
    voteCountUser2: number,
  ) => void;
}

const URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/debate`
  : "http://localhost:3000/debate";

export const useDebateRoom = create<DebateRoomStore>((set, get) => ({
  currentDebateId: null,
  usersInRoom: [],
  spectatorCount: 0,
  socket: null,
  votes: { user1: 0, user2: 0 },
  userVote: null,
  setVotes: (voteCountUser1, voteCountUser2) => {
    set({ votes: { user1: voteCountUser1, user2: voteCountUser2 } });
  },

  setUserVote: (userId) => set({ userVote: userId }),
  subscribeToDebateRoom: (roomId: string, userId: string) => {
    let socket = get().socket;
    if (!socket) {
      socket = io(URL, { query: { userId } });
      set({ socket: socket });
    }
    if (!socket) return;
    if (get().currentDebateId === roomId) return;
    const previous = get().currentDebateId;
    if (previous) {
      get().unsubscribeFromDebateRoom(previous);
    }

    socket.off("receiverList");
    socket.on("receiverList", (userIds: string[]) => {
      set({ usersInRoom: userIds });
    });

    socket.off("debate:spectatorCount");
    socket.on("debate:spectatorCount", ({ count }: { count: number }) => {
      set({ spectatorCount: count });
    });

    socket.emit("debate:join", roomId);

    set({ currentDebateId: roomId });
  },
  handleCallUser: async (socketId: any) => {
    const socket = get().socket;
    if (!socket) return;
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: socketId, offer });
  },
  sendIceCandidate: (to: string, candidate: RTCIceCandidate) => {
    const socket = get().socket;
    socket?.emit("ice-candidate", { to, candidate });
  },
  unsubscribeFromDebateRoom: (roomId: string) => {
    const socket = get().socket;
    if (!socket) return;
    socket.emit("debate:leave", roomId);
    socket.off("receiverList");
    socket.off("debate:spectatorCount");
    set({ currentDebateId: null, usersInRoom: [], spectatorCount: 0 });
  },
  subscribeToVotes: () => {
    const socket = get().socket;
    if (!socket) return;
    socket.off("debate:votesUpdated");
    socket.on(
      "debate:votesUpdated",
      ({
        voteCountUser1,
        voteCountUser2,
      }: {
        voteCountUser1: number;
        voteCountUser2: number;
      }) => {
        get().setVotes(voteCountUser1, voteCountUser2);
      },
    );
  },

  broadcastVoteUpdate: (debateId, voteCountUser1, voteCountUser2) => {
    const socket = get().socket;
    socket?.emit("debate:votesUpdated", {
      debateId,
      voteCountUser1,
      voteCountUser2,
    });
  },
}));
