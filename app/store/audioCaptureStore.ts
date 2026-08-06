"use client";
import { create } from "zustand";

interface AudioCaptureStore {
  isRecording: boolean;
  mediaRecorder: MediaRecorder | null;
  chunks: Blob[];
  mimeType: string;

  startRecording: (stream: MediaStream) => void;
  stopAndTranscribe: () => Promise<string>;
}

function pickMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "";
}

export const useAudioCapture = create<AudioCaptureStore>((set, get) => ({
  isRecording: false,
  mediaRecorder: null,
  chunks: [],
  mimeType: "",

  startRecording: (stream: MediaStream) => {
    if (get().isRecording) return;

    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined,
    );
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.start(1000);
    set({ isRecording: true, mediaRecorder: recorder, chunks, mimeType });
  },

  stopAndTranscribe: async () => {
    const { mediaRecorder, chunks, mimeType, isRecording } = get();
    if (!isRecording || !mediaRecorder) return "";

    const blob = await new Promise<Blob>((resolve) => {
      mediaRecorder.onstop = () => {
        resolve(new Blob(chunks, { type: mimeType || "audio/webm" }));
      };
      mediaRecorder.stop();
    });

    set({ isRecording: false, mediaRecorder: null, chunks: [] });

    if (blob.size === 0) return "";

    try {
      const formData = new FormData();
      formData.append("audio", blob, "turn.webm");

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        console.error("[audio-capture] transcribe request failed:", res.status);
        return "";
      }

      const { text } = await res.json();
      return text ?? "";
    } catch (err) {
      console.error("[audio-capture] transcribe request errored:", err);
      return "";
    }
  },
}));