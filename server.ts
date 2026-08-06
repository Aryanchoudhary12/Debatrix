import { setDefaultAutoSelectFamily } from "net";
setDefaultAutoSelectFamily(false);

import "dotenv/config";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import next from "next";
import prisma from "./app/lib/prisma";
import { registerDebateNamespace } from "./app/lib/socketEmitter";

interface Receivers {
  [userId: string]: string[];
}

const dev = process.env.NODE_ENV != "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const receivers: Receivers = {};
export const getReceiverSocketId = (
  receiverId: string,
): string[] | undefined => {
  return receivers[receiverId];
};

interface DebateRoomMembers {
  [debateId: string]: {
    [userId: string]: string[];
  };
}
const debateRooms: DebateRoomMembers = {};

export const getUsersInDebate = (debateId: string): string[] => {
  return Object.keys(debateRooms[debateId] ?? {});
};

export const getUserSocketsInDebate = (
  debateId: string,
  userId: string,
): string[] | undefined => {
  return debateRooms[debateId]?.[userId];
};

const roomName = (debateId: string) => `debate:${debateId}`;

function getSpectatorCount(
  debateId: string,
  participantUserIds: string[],
): number {
  const participantSet = new Set(participantUserIds);
  return Object.keys(debateRooms[debateId] ?? {}).filter(
    (uid) => !participantSet.has(uid),
  ).length;
}

app.prepare().then(() => {
  const httpServer = createServer(handle);
  const io = new Server(httpServer, {
    cors: {
      origin: dev ? "http://localhost:3000" : process.env.NEXT_PUBLIC_APP_URL,
      credentials: true,
    },
  });
  const debate_io = io.of("/debate");
  registerDebateNamespace(debate_io);
  debate_io.on("connection", (socket: Socket) => {
    const userId = socket.handshake.query.userId as string;
    console.log(
      `new user entered debate namespace: ${socket.id} (user ${userId})`,
    );
    let currentDebateId: string | null = null;
    socket.on(
      "debate:timeSync",
      (clientTime: number, cb: (t: number) => void) => {
        cb(Date.now());
      },
    );
    socket.on("debate:join", async (debateId: string) => {
      if (!debateId || !userId) return;
      if (currentDebateId && currentDebateId !== debateId) {
        await leaveDebateRoom(socket, currentDebateId, userId);
      }

      socket.join(roomName(debateId));
      socket.to(roomName(debateId)).emit("userJoined", {
        userId,
        socketId: socket.id,
      });
      currentDebateId = debateId;
      if (!debateRooms[debateId]) debateRooms[debateId] = {};
      if (!debateRooms[debateId][userId]) debateRooms[debateId][userId] = [];
      debateRooms[debateId][userId].push(socket.id);
      debate_io
        .to(roomName(debateId))
        .emit("receiverList", getUsersInDebate(debateId));

      const participants = await prisma.debateParticipant.findMany({
        where: { debateId },
        select: { userId: true },
      });
      const count = getSpectatorCount(
        debateId,
        participants.map((p) => p.userId),
      );
      debate_io.to(roomName(debateId)).emit("debate:spectatorCount", { count });

      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/graphql`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `mutation UpdateMaxSpectators($debateId: ID!, $count: Int!) {
          updateMaxSpectators(debateId: $debateId, count: $count) { id spectators }
        }`,
            variables: { debateId, count },
          }),
        });
      } catch (err) {
        console.error("Failed to persist spectator count:", err);
      }
    });

    socket.on("debate:passTurn", async ({ debateId, nextUserId }) => {
      const turnStartedAt = new Date();
      try {
        await prisma.debate.update({
          where: { id: debateId },
          data: { activeUserId: nextUserId, turnStartedAt },
        });
      } catch (err) {
        console.error("Failed to persist turn change:", err);
      }
      debate_io.to(roomName(debateId)).emit("debate:turnChanged", {
        nextUserId,
        turnStartedAt: turnStartedAt.toISOString(),
      });
    });

    socket.on(
      "debate:votesUpdated",
      ({
        debateId,
        votes,
      }: {
        debateId: string;
        votes: Record<string, number>;
      }) => {
        debate_io.to(roomName(debateId)).emit("debate:votesUpdated", { votes });
      },
    );

    socket.on("debate:leave", async (debateId: string) => {
      await leaveDebateRoom(socket, debateId, userId);
      if (currentDebateId === debateId) currentDebateId = null;
    });

    socket.on("disconnect", async () => {
      console.log(`user disconnected from debate namespace: ${socket.id}`);
      if (currentDebateId) {
        await leaveDebateRoom(socket, currentDebateId, userId);
      }
    });
  });

  async function leaveDebateRoom(
    socket: Socket,
    debateId: string,
    userId: string,
  ) {
    socket.leave(roomName(debateId));
    const room = debateRooms[debateId];
    if (!room || !room[userId]) return;
    room[userId] = room[userId].filter((id) => id !== socket.id);
    if (room[userId].length === 0) delete room[userId];
    if (Object.keys(room).length === 0) delete debateRooms[debateId];

    const participants = await prisma.debateParticipant.findMany({
      where: { debateId },
      select: { userId: true },
    });
    debate_io.to(roomName(debateId)).emit("debate:spectatorCount", {
      count: getSpectatorCount(
        debateId,
        participants.map((p) => p.userId),
      ),
    });
  }

  io.on("connection", (socket: Socket) => {
    console.log("new user connected : " + socket.id);
    const userId = socket.handshake.query.userId as string;
    if (!receivers[userId]) receivers[userId] = [];
    receivers[userId].push(socket.id);
    io.emit("receiverList", Object.keys(receivers));

    socket.on("disconnect", () => {
      console.log("user disconnected : " + socket.id);
      receivers[userId] =
        receivers[userId]?.filter((id: string) => id !== socket.id) ?? [];
      if (receivers[userId].length === 0) delete receivers[userId];
      io.emit("receiverList", Object.keys(receivers));
    });
  });

  httpServer.listen(3000, () => {
    console.log("server is running on port 3000");
  });
});
