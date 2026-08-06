"use client";
import Button from "@/app/components/ui/button";
import ImageUploader from "@/app/components/ui/imageUploader";
import React, { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import Avatar from "@/app/components/ui/avatarProvider";
import OnBoardModel from "./onBoardModel";
import { useSession } from "next-auth/react";
interface ProfileSidebarProps {
  listenerId: string;
  username: string;
  imageUrl?: string;
  tagline: string;
  elo: number;
  likes: number;
  interests: string[];
  joinedDate: string;
}

interface UpdateListenerData {
  updateListener: {
    id: string;
    tagline: string | null;
    interests: string[];
  };
}

interface UpdateListenerVars {
  id: string;
  tagline?: string;
  interests?: string[];
}
interface CreateListenerData {
  createListener: {
    userId: string;
    tagline: string | null;
    interests: string[];
  };
}

interface CreateListenerVars {
  userId: string;
  tagline?: string;
  interests: string[];
}

const UPDATE_LISTENER = gql`
  mutation UpdateListener($id: ID!, $tagline: String, $interests: [String!]) {
    updateListener(id: $id, tagline: $tagline, interests: $interests) {
      id
      tagline
      interests
    }
  }
`;

const CREATE_LISTENER = gql`
  mutation createListener(
    $userId: ID!
    $tagline: String
    $interests: [String!]!
  ) {
    createListener(userId: $userId, tagline: $tagline, interests: $interests) {
      id
      tagline
      interests
    }
  }
`;

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  listenerId,
  username,
  imageUrl,
  tagline,
  elo,
  interests,
  joinedDate,
}) => {
  const { data: session } = useSession();
  const [updateListener] = useMutation<UpdateListenerData, UpdateListenerVars>(
    UPDATE_LISTENER,
    {
      update(cache, { data }) {
        if (!data?.updateListener) return;
        cache.modify({
          id: cache.identify({
            __typename: "Listener",
            id: data.updateListener.id,
          }),
          fields: {
            tagline: () => data.updateListener.tagline,
            interests: () => data.updateListener.interests,
          },
        });
      },
    },
  );

  const [createListener] = useMutation<CreateListenerData, CreateListenerVars>(
    CREATE_LISTENER,
    {},
  );

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      await axios.post("/api/profile/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Profile picture updated successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image. Please try again.");
    }
  };

  const onSubmit = async (data: { tagline?: string; interests?: string[] }) => {
    try {
      if (listenerId) {
        await updateListener({
          variables: {
            id: listenerId,
            tagline: data.tagline,
            interests: data.interests,
          },
        });
      } else {
        await createListener({
          variables: {
            userId: session?.user?.id as string,
            tagline: data.tagline,
            interests: data.interests ?? [],
          },
        });
      }
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    }
  };

  return (
    <aside className="w-full lg:w-80 rounded-2xl bg-muted/50 backdrop-blur-lg border border-primary/15 p-6 flex flex-col justify-between self-start shadow-xl font-poppins">
      <div className="space-y-6">
        <div className="relative">
          <div className="h-24 rounded-xl bg-linear-to-r from-violet-600 via-indigo-600 to-purple-600 p-4 flex items-end justify-end"></div>
          <div className="relative -top-10 left-4 flex items-end space-x-3">
            <Avatar
              username={username}
              src={imageUrl}
              className="h-20 w-20 rounded-2xl! "
            />

            <ImageUploader
              className="absolute -bottom-2 right-10 size-10 p-0!"
              onChange={handleImageUpload}
            />
          </div>
        </div>

        <div className="space-y-1 -mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{username}</h2>
            <span className="text-sm font-semibold text-indigo-400">
              {elo} ELO
            </span>
          </div>
          <p className="text-xs text-accent font-medium">{tagline}</p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">
            Top Debate Topics
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {interests.map((topic, i) => (
              <span
                key={i}
                className="rounded-2xl px-4 py-2 text-xs font-medium bg-secondary text-muted"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3 py-4 border-y border-primary/50 text-sm">
          <div className="flex justify-between text-accent">
            <span className="font-bold">Member Since</span>
            <span className="text-secondary font-semibold">{joinedDate}</span>
          </div>
        </div>
      </div>

      <div className="pt-6 space-y-3">
        <OnBoardModel onSubmit={onSubmit} />
      </div>
    </aside>
  );
};
