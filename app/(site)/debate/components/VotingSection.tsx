"use client";

import React from "react";
import { TbDeviceTvOldFilled } from "react-icons/tb";
import Button from "@/app/components/ui/button";

export type VoteChoice = "me" | "opponent" | null;

export interface VotingSectionProps {
  debater1Name: string;
  debater2Name: string;
  votes1: number;
  votes2: number;
  userVote: VoteChoice;
  onVote: (choice: "me" | "opponent") => void;
}

export default function VotingSection({
  debater1Name,
  debater2Name,
  votes1,
  votes2,
  userVote,
  onVote,
}: VotingSectionProps) {
  const totalVotes = votes1 + votes2;
  const percentage1 =
    totalVotes === 0 ? 50 : Math.round((votes1 / totalVotes) * 100);
  const percentage2 = totalVotes === 0 ? 50 : 100 - percentage1;

  return (
    <section className="w-full bg-muted/50 backdrop-blur-lg p-6 rounded-xl border border-primary/20 my-6 font-poppins">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TbDeviceTvOldFilled className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-secondary">
            Live Audience Sentiment & Voting
          </h2>
        </div>
        <span className="text-xs text-secondary font-mono">
          Total Votes: {totalVotes.toLocaleString()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Button
          onClick={() => onVote("me")}
          className={`relative flex items-center justify-between! p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer`}
          variant={userVote === "me" ? "secondary" : "outline"}
        >
          <div>
            <span className="text-xs uppercase tracking-wider block opacity-70 mb-0.5">
              Vote For
            </span>
            <span className="font-bold text-base block ">{debater1Name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-mono font-extrabold text-primary">
              {percentage1}%
            </span>
          </div>
        </Button>

        <Button
          onClick={() => onVote("opponent")}
          className={`relative flex items-center justify-between! p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer`}
          variant={userVote === "opponent" ? "secondary" : "outline"}
        >
          <div>
            <span className="text-xs uppercase tracking-wider block opacity-70 mb-0.5">
              Vote For
            </span>
            <span className="font-bold text-base block ">{debater2Name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-mono font-extrabold text-primary">
              {percentage2}%
            </span>
          </div>
        </Button>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-secondary px-1">
          <span>
            {debater1Name} ({percentage1}%)
          </span>
          <span>
            {debater2Name} ({percentage2}%)
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-muted-foreground/20 overflow-hidden flex p-0.5 border border-primary/20">
          <div
            className="h-full bg-primary rounded-l-full transition-all duration-500"
            style={{ width: `${percentage1}%` }}
          />
          <div
            className="h-full bg-primary/40 rounded-r-full transition-all duration-500"
            style={{ width: `${percentage2}%` }}
          />
        </div>
      </div>
    </section>
  );
}
