"use client";

import { useEffect, useRef, useState } from "react";
import { DebateMetrics } from "../(site)/debate/components/AIAnalyticsDashboard";

const JIGGLE_INTERVAL_MS = 1400;
const IDLE_DRIFT = 5;
const SPEAKING_DRIFT = 15;
const SPEAKING_BIAS = 0.65;

const FLOOR = 15;
const CEIL = 60;

function clamp(n: number, min = FLOOR, max = CEIL): number {
  return Math.min(max, Math.max(min, n));
}

function roundTo2(n: number): number {
  return Number(n.toFixed(2));
}

function jiggleOnce(current: number, isSpeaking: boolean): number {
  if (isSpeaking) {
    const step = (Math.random() * 2 - 1) * SPEAKING_DRIFT + SPEAKING_BIAS;
    return roundTo2(clamp(current + step));
  }

  const step = (Math.random() * 2 - 1) * IDLE_DRIFT;
  return roundTo2(clamp(current + step));
}

function randomStart(): DebateMetrics {
  const base = 35 + Math.random() * 15;

  return {
    overallScore: roundTo2(clamp(base + (Math.random() * 6 - 3))),
    logicScore: roundTo2(clamp(base + (Math.random() * 6 - 3))),
    persuasionScore: roundTo2(clamp(base + (Math.random() * 6 - 3))),
    factCheckAccuracy: roundTo2(clamp(base + (Math.random() * 6 - 3))),
  };
}

export function useLiveJiggleMetrics(
  isLive: boolean,
  isSpeaking: boolean,
  finalMetrics: DebateMetrics | null,
): DebateMetrics {
  const [display, setDisplay] = useState<DebateMetrics>(() => randomStart());
  const appliedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!finalMetrics) return;

    const key = `${finalMetrics.overallScore}|${finalMetrics.logicScore}|${finalMetrics.persuasionScore}|${finalMetrics.factCheckAccuracy}`;
    if (appliedRef.current === key) return; 

    appliedRef.current = key;

    setDisplay({
      overallScore: roundTo2(finalMetrics.overallScore),
      logicScore: roundTo2(finalMetrics.logicScore),
      persuasionScore: roundTo2(finalMetrics.persuasionScore),
      factCheckAccuracy: roundTo2(finalMetrics.factCheckAccuracy),
    });
  }, [finalMetrics]);

  useEffect(() => {
    if (finalMetrics || !isLive) return;

    const intervalId = setInterval(() => {
      setDisplay((prev) => ({
        overallScore: jiggleOnce(prev.overallScore, isSpeaking),
        logicScore: jiggleOnce(prev.logicScore, isSpeaking),
        persuasionScore: jiggleOnce(prev.persuasionScore, isSpeaking),
        factCheckAccuracy: jiggleOnce(prev.factCheckAccuracy, isSpeaking),
      }));
    }, JIGGLE_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isLive, isSpeaking, finalMetrics]);

  return {
    overallScore: roundTo2(display.overallScore),
    logicScore: roundTo2(display.logicScore),
    persuasionScore: roundTo2(display.persuasionScore),
    factCheckAccuracy: roundTo2(display.factCheckAccuracy),
  };
}