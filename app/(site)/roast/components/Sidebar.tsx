import React from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/app/components/ui/sidebar";
import Avatar from "@/app/components/ui/avatarProvider";
import { FaStar } from "react-icons/fa";
import StatCard from "./statCard";
import { IoMedal } from "react-icons/io5";
import CreateRoastModel from "../../debate/components/createRoastModel";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useSession } from "next-auth/react";
import {useRoastStore} from "@/app/store/roastStore";
interface Argument {
  label: string;
}
interface SidebarProps {
  username: string;
  imageUrl?: string;
  overallScore: number;
  persuasionScore: number;
  aiFeedbackSummary: String;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}
const GET_ROASTS = gql`
  query getRoastsByUserId($userId: String!) {
    getRoastsByUserId(userId: $userId) {
      id
      title
    }
  }
`;
export const ChatSidebar: React.FC<SidebarProps> = ({
  username,
  imageUrl,
  overallScore,
  persuasionScore,
  aiFeedbackSummary,
  open,
  setOpen,
}) => {
  const { data: session } = useSession();
  const {setRoastId} = useRoastStore();
  const { data, loading, error } = useQuery<{
    getRoastsByUserId: { id: string; title: string }[];
  }>(GET_ROASTS, {
    variables: {
      userId: session?.user?.id,
    },
  });
  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10 bg-muted/50 rounded-2xl lg:rounded-r-none backdrop-blur-lg border border-primary/25 p-2 no-visible-scrollbar overflow-y-auto">
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto no-visible-scrollbar">
          <div>
            <div className="flex items-center gap-3">
              <Avatar
                username={username}
                src={imageUrl}
                size="md"
                className="rounded-md"
              />
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold text-accent font-montserrat ">
                  {username}
                </h3>
                <span className="flex items-center gap-2 text-xs text-accent font-poppins font-semibold">
                  {overallScore / 10}/10 <FaStar />
                </span>
              </div>
            </div>
          </div>
          {open && (
            <div className="mt-4">
              <span className="font-medium font-poppins text-sm text-secondary line-clamp-4">
                {aiFeedbackSummary}
              </span>
            </div>
          )}
          {open && (
            <div className="grid grid-cols-1 gap-2 mt-4">
              <StatCard
                title="Persuasion Score (Out of 10)"
                value={persuasionScore / 10}
                icon={
                  <IoMedal className="size-8.5 p-2 bg-sky-200/20 text-sky-100 rounded-3xl" />
                }
              />
              <StatCard
                title="Overall Score (Out of 10)"
                value={overallScore / 10}
                icon={
                  <IoMedal className="size-8.5 p-2 bg-sky-200/20 text-sky-100 rounded-3xl" />
                }
              />
            </div>
          )}
          <CreateRoastModel open={open} />
          <div className="mt-4 flex flex-col pt-3 gap-2 border-t border-primary/20 font-poppins">
            {data?.getRoastsByUserId?.map((arg) => (
              <span
                className={`flex items-center gap-3`}
                key={arg.id}
              >
                <div className="size-3 rounded-2xl bg-primary shrink-0" />
                <span className="text-xs text-accent font-medium font-poppins line-clamp-1 hover:cursor-pointer hover:translate-x-1 duration-200" onClick={() => setRoastId(arg.id)}>
                  {arg.title}
                </span>
              </span>
            ))}
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
};
