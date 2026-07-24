"use client";

import { useRef, useCallback, useEffect, useState } from "react";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

export function useSpeechCapture() {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const finalTextRef = useRef(""); // accumulates since the last flush
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn(
        "[speech] SpeechRecognition not supported in this browser — falling back to manual text input recommended.",
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTextRef.current += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimText(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("[speech] recognition error:", event.error);
    };

    recognition.onend = () => {
      if (isListening) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    finalTextRef.current = "";
    setInterimText("");
    recognitionRef.current.start();
    setIsListening(true);
  }, []);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  const flushTurnText = useCallback((): string => {
    const text = finalTextRef.current.trim();
    finalTextRef.current = "";
    setInterimText("");
    return text;
  }, []);

  return { isListening, interimText, start, stop, flushTurnText };
}