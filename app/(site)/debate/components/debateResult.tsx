import React from "react";
import Avatar from "@/app/components/ui/avatarProvider";
import { ComicText } from "@/app/components/ui/comic-text";
import vs from "@/public/vs.png";
import Image from "next/image";
import { FaCrown } from "react-icons/fa6";

interface participant {
  name: string;
  image: string;
  votes: number;
}
interface DebateResultProps {
  totalVotes: number;
  participants: participant[];
}
function DebateResult({ totalVotes, participants }: DebateResultProps) {
  const votePercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return (votes / totalVotes) * 100;
  };
  return (
    <div className="relative flex flex-col justify-center items-center p-6 rounded-xl border transition-all duration-300 bg-muted/50 backdrop-blur-lg font-poppins border-primary/10 w-full">
      <ComicText className="text-2xl text-primary font-bold mb-4" fontSize={2}>
        Debate is Over !
      </ComicText>
      <p className="max-w-xl text-center text-sm font-medium text-shadow-xs text-shadow-blue-400">
        Debate is over! Here are the results and more information are provided below on debate analytics section.
      </p>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 relative">
        {participants.map((participant, index) => (
          <div
            key={index}
            className="relative flex items-center justify-center w-full p-6 py-10 rounded-xl border transition-all duration-300 bg-muted/50 backdrop-blur-lg font-poppins border-primary/10"
          >
            <div className="relative">
              <div className="flex flex-col">
                <Avatar
                  src={participant.image}
                  username={participant.name}
                  size="xl"
                  className="border-2 border-primary size-40! text-3xl rounded-[4.5rem]! z-1"
                  imageClassName="size-40! rounded-[4.5rem]! z-1"
                />
                <span className="text-lg font-semibold p-2 px-6 pt-4 bg-primary text-white font-montserrat skew-6 relative bottom-3">
                  {participant.name}
                </span>
              </div>
              <p className="absolute text-sm font-bold bg-accent text-muted p-3 size-16 rounded-full flex flex-col items-center justify-center gap-0 mt-2 top-0 -right-5 z-1">
                {votePercentage(participant.votes).toFixed(1)}%
                <span className="text-[10px] font-poppins font-light -mt-0.5">
                  Votes
                </span>
              </p>
              {votePercentage(participant.votes) >= 50 && (
                <FaCrown className="absolute top-0 left-8 transform -translate-x-1/2 -translate-y-1/2 z-1 text-yellow-400 size-12 -rotate-30" />
              )}
            </div>
          </div>
        ))}
        <Image src={vs} alt="VS" className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0" height={100} width={100} />
      </div>
    </div>
  );
}

export default DebateResult;
