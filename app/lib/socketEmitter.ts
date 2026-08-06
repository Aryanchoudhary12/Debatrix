import type { Namespace } from "socket.io";

const g = globalThis as unknown as { __debateNamespace?: Namespace };

export function registerDebateNamespace(ns: Namespace) {
  g.__debateNamespace = ns;
  console.log("[socketEmitter] namespace registered");
}

export function emitDebateUpdate(
  debateId: string,
  event: string,
  payload: unknown,
) {
  if (!g.__debateNamespace) {
    console.warn("[socketEmitter] debate namespace not registered yet");
    return;
  }
  g.__debateNamespace.to(`debate:${debateId}`).emit(event, payload);
}