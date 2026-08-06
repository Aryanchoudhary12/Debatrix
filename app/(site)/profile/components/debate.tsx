import Button from "@/app/components/ui/button";
import React from "react";
import { LiveSpectatorCount } from "../../debate/components/liveSpectatorCount";
import { TbDeviceTvOldFilled } from "react-icons/tb";

interface DebateRoom {
  id: string;
  topic: string;
  category: string;
  opponent: string;
  status: "Waiting" | "Live" | "Completed" | "Cancelled";
  spectators: number;
  userVotes: number;
  opponentVotes: number;
}

interface ActiveDebatesProps {
  debates: DebateRoom[];
  onJoin: (debateId: string) => void;
  joiningId?: string | null;
}

export const ActiveDebates: React.FC<ActiveDebatesProps> = ({
  debates,
  onJoin,
  joiningId,
}) => {
  return (
    <div className="space-y-4 font-poppins">
      <div className="space-y-3">
        {debates.map((room) => {
          const totalVotes = room.userVotes + room.opponentVotes || 1;
          const userVotePercent = Math.round(
            (room.userVotes / totalVotes) * 100,
          );
          const opponentVotePercent = Math.round(
            (room.opponentVotes / totalVotes) * 100,
          );

          return (
            <div
              key={room.id}
              className="rounded-2xl bg-muted/40 backdrop-blur-lg border border-primary/20 p-5 transition hover:border-primary/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1 md:max-w-md">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    {room.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-3 py-1 rounded-full ${room.status === "Waiting" ? "bg-primary/20 text-foreground border border-primary/30" : "bg-accent text-muted"}`}
                  >
                    {room.status === "Waiting" ? "Waiting" : room.status}
                  </span>
                </div>
                <h4 className="text-base font-bold text-accent">
                  {room.topic}
                </h4>
                <p className="text-xs text-secondary">
                  Debating against{" "}
                  <span className="text-accent font-semibold">
                    {room.opponent}
                  </span>
                </p>
              </div>

              <div className="flex-1 max-w-sm space-y-2 bg-muted/40 p-3 rounded-xl border border-primary/20">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-secondary">
                    User ({userVotePercent}%)
                  </span>
                  <span className="text-secondary">
                    Opponent ({opponentVotePercent}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-purple-500/30 overflow-hidden flex">
                  <div
                    className="h-full bg-secondary transition-all duration-500"
                    style={{ width: `${userVotePercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="small"
                    className="rounded-sm w-full"
                    variant="secondary"
                    onClick={() => onJoin(room.id)}
                    disabled={joiningId === room.id}
                    loading={joiningId === room.id}
                  >
                    {room.status === "Waiting"
                      ? "Join Debate"
                      : "View Analytics"}
                  </Button>
                  <Button
                    size="small"
                    className="rounded-sm w-full"
                    variant="outline"
                  >
                    {room.status === "Waiting" || room.status === "Live" ? (
                      <span className="flex items-center gap-1">
                        <TbDeviceTvOldFilled />{" "}
                        <LiveSpectatorCount
                          debateId={room.id}
                          status={room.status}
                          fallbackCount={room.spectators}
                        />{" "}
                        watching
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <TbDeviceTvOldFilled /> {room.spectators} max views
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
