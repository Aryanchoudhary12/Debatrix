"use client";
import { Clock } from "lucide-react";

export interface DebateHeaderProps {
  topic: string;
  globalTimeLeft: number;
  spectatorCount?: number;
}
export default function DebateHeader({
  topic,
  globalTimeLeft,
  spectatorCount,
}: DebateHeaderProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isTimeRunningOut = globalTimeLeft <= 180;

  return (
    <header className="w-full bg-muted/50 backdrop-blur-lg border border-primary/10 px-6 py-3 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 font-poppins">
      <div className="flex flex-col gap-1 w-full">
        <h1 className="text-xl font-bold text-accent">{topic}</h1>
        <span className="text-secondary text-shadow-md text-shadow-sky-500 text-xs font-montserrat font-extrabold mt-0.5 ">
          {spectatorCount !== undefined
            ? ` ${spectatorCount} watching`
            : "0 watching"}
        </span>
      </div>

      <div className="flex items-center gap-4 bg-accent px-4 py-2 rounded-lg border border-primary/30 w-full md:w-fit shrink-0">
        <div className="flex items-center gap-2">
          <Clock
            className={`w-5 h-5 ${isTimeRunningOut ? "text-red-400 animate-bounce" : "text-primary"}`}
          />
          <span className="text-xs uppercase tracking-wider text-muted font-semibold">
            Total Time:
          </span>
          <span
            className={`text-lg font-mono font-bold ${
              isTimeRunningOut ? "text-red-400" : "text-background"
            }`}
          >
            {formatTime(globalTimeLeft)}
          </span>
        </div>

        <button className="p-1.5 hover:bg-primary/10 rounded-md text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"></button>
      </div>
    </header>
  );
}
