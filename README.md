# Debatrix

A real-time platform for structured, live debates — turn-based speaking rounds, live audio, and automatic transcription, built for two (or more) participants to debate a topic with enforced timing and structure rather than an unmoderated free-for-all.

---

## Overview

Debatrix brings the structure of a formal debate (timed turns, defined rounds, clear speaker order) into a live, audio-first web experience. Participants join a debate room, speak during their allotted turn, and the platform handles timing, turn transitions, and live transcription of what's said — so a debate has the same real-time energy as a conversation, but with the discipline of a moderated format.

---

## Features

- **Live structured debates** — turn-based speaking rounds with enforced timers per turn, rather than open-floor conversation
- **Real-time audio** — low-latency voice communication between participants during the debate
- **Live transcription** — spoken turns are transcribed in real time, producing a readable record of the debate as it happens
- **Automatic turn/round progression** — timers drive transitions between speakers and rounds without manual moderation
- **Real-time state sync** — all participants (and spectators, where applicable) see the same live debate state — current speaker, time remaining, round — without manual refreshing
- **Room-based sessions** — debates are organized into rooms with membership and connection state tracked per session

---

## High-Level Architecture

Debatrix separates concerns across three real-time-capable layers: a web client, a signaling/state layer, and a dedicated media layer for audio — rather than routing everything (including audio) through one general-purpose server.

```
                        ┌─────────────────────────┐
                        │        Client            │
                        │  Next.js (App Router)     │
                        │  Zustand (client state)   │
                        └───────────┬─────────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                   │
        GraphQL (queries/          WebSocket            WebRTC (audio)
        mutations)                 (Socket.IO)           via LiveKit SDK
                 │                  │                   │
                 ▼                  ▼                   ▼
        ┌─────────────────┐  ┌─────────────┐   ┌─────────────────┐
        │  Apollo Server    │  │  Socket.IO   │   │  LiveKit SFU     │
        │  (GraphQL API)     │  │  (real-time   │   │  (media server)  │
        │                   │  │  room/turn    │   │                   │
        │  Prisma ORM        │  │  state)       │   │  Handles audio    │
        └────────┬──────────┘  └──────┬──────┘   │  forwarding only  │
                 │                    │           │  (no app logic)   │
                 ▼                    │           └─────────────────┘
        ┌─────────────────┐          │
        │   PostgreSQL      │◄────────┘
        │  (debates, users,  │   (room/turn state changes
        │   rounds, results) │    persisted as needed)
        └─────────────────┘
```

**Why the audio path is separate from the application server:** debate audio is handled directly between each client and LiveKit's SFU (Selective Forwarding Unit), not proxied through the Node application server. The app server's responsibility is signaling and state — room membership, authentication, turn/timer logic — never the audio bytes themselves. This keeps the real-time audio path low-latency and keeps the application server's load independent of how many participants are actively speaking.

**Why GraphQL + Socket.IO are both present:** GraphQL (via Apollo) handles conventional request/response data — fetching debate details, creating a debate, submitting a result — while Socket.IO handles the continuously updating, low-latency state every participant needs to stay in sync on: whose turn it is, time remaining, round transitions, and connection/presence state. Splitting these avoids forcing either a polling-based GraphQL pattern onto fast-changing live state, or routing simple CRUD operations through a socket-based protocol that isn't built for it.

---

## Tech Stack

**Frontend**
- [Next.js](https://nextjs.org/) (App Router)
- [Zustand](https://github.com/pmndrs/zustand) — client-side state management
- Apollo Client — GraphQL data fetching

**Backend**
- Node.js
- Apollo Server — GraphQL API layer
- [Prisma](https://www.prisma.io/) ORM
- PostgreSQL — primary data store (debates, users, rounds, results)
- Socket.IO — real-time room, turn, and timer state synchronization

**Real-time audio**
- [LiveKit](https://livekit.io/) — WebRTC-based SFU for real-time audio between participants
- Live transcription pipeline (in progress: migrating from the browser Web Speech API to a LiveKit Agent-based pipeline using Groq Whisper via `@livekit/agents-plugin-openai`)

---

## Notable Engineering Challenges Solved

A few non-trivial issues encountered and resolved during development:

- **LiveKit disconnection bug** — resolved by switching from the `<LiveKitRoom>` component to `RoomContext.Provider`, fixing unexpected audio disconnections.
- **GraphQL null resolver bug** — `Debate.participants` was occasionally returning null due to a resolver branch that didn't include participant relations; fixed by ensuring all branches consistently include them.
- **Timer bug (`NaN:NaN`)** — fixed incorrect timer state alongside the related auto-finalize logic for ending a debate automatically when time expires.
- **Module singleton issue** — `socketEmitter.ts` was being instantiated as separate instances across Next.js's module graph (a common pitfall with Next.js's module resolution in certain execution contexts); fixed by storing the singleton instance on `globalThis` to guarantee a single shared instance.
- **"Waiting" state reliability** — added a 3-second polling fallback for the waiting-room state to handle cases where real-time events alone weren't sufficient to reflect the current state promptly.

---

## Roadmap

- [ ] Deploy LiveKit Agent-based live transcription (Groq Whisper), replacing the current Web Speech API implementation
- [ ] Expand debate formats beyond the current structure (e.g., team debates, audience voting)

---

## Getting Started

> Add setup instructions here — environment variables (database URL, LiveKit API keys), install steps, and local dev commands.

```bash
# install dependencies
npm install

# run database migrations
npx prisma migrate dev

# start the dev server
npm run dev
```

---
