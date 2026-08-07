"use client";
import Button from "@/app/components/ui/button";
import { Clock } from "lucide-react";
import { TiCancel } from "react-icons/ti";
import { useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import toast from "react-hot-toast";
import { useState } from "react";

export interface DebateHeaderProps {
  topic: string;
  globalTimeLeft: number;
  spectatorCount?: number;
  status: "Waiting" | "Live" | "Completed" | "Cancelled";
  debateId: string;
}

const CANCEL_DEBATE = gql`
  mutation CancelDebate($debateId: ID!) {
    cancelDebate(debateId: $debateId) {
      id
      status
    }
  }
`;

export default function DebateHeader({
  topic,
  globalTimeLeft,
  spectatorCount,
  status,
  debateId,
}: DebateHeaderProps) {
  const [confirming, setConfirming] = useState(false);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isTimeRunningOut = globalTimeLeft <= 180;

  const [cancelDebate, { loading: cancelling }] = useMutation(CANCEL_DEBATE, {
    onCompleted: () => {
      toast.error("Debate has been cancelled", { duration: 3000 });
      setConfirming(false);
    },
    onError: (err) => {
      console.error("Error cancelling debate:", err);
      toast.error(err.message || "Failed to cancel debate", { duration: 3000 });
      setConfirming(false);
    },
  });

  const handleCancelClick = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    cancelDebate({ variables: { debateId } });
  };

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
      <div className="flex items-center gap-4 w-full md:w-fit justify-between md:justify-end">
        <div className="flex items-center gap-4 bg-accent px-4 py-2 rounded-lg border border-primary/30 w-fit shrink-0">
          <div className="flex items-center gap-2">
            <Clock
              className={`w-5 h-5 ${isTimeRunningOut ? "text-red-400 animate-bounce" : "text-primary"}`}
            />
            <span className="text-xs uppercase tracking-wider text-muted font-semibold hidden md:inline">
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
        </div>
        {(status === "Live" || status === "Waiting") && (
          <Button
            className="flex items-center gap-2 bg-red-500 hover:bg-destructive transition-all duration-100 rounded-sm h-12"
            onClick={handleCancelClick}
            disabled={cancelling}
            loading={cancelling}
          >
            <TiCancel className="size-5"/>
            {confirming ? "Confirm?" : "Cancel"}
          </Button>
        )}
      </div>
    </header>
  );
}