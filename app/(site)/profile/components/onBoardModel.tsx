"use client";
import React, { useState, useEffect, KeyboardEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import Button from "@/app/components/ui/button";
import InputField from "@/app/components/ui/inputField";
import {
  ProfileFormValues,
  profileSchema,
} from "@/app/schema/profileSchema/profileSchema";

interface OnBoardModelProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialData?: ProfileFormValues | null;
  onSubmit: (data: ProfileFormValues) => Promise<void> | void;
  trigger?: React.ReactNode;
}

export default function OnBoardModel({
  isOpen,
  onOpenChange,
  initialData,
  onSubmit,
  trigger,
}: OnBoardModelProps) {
  const isEditMode = Boolean(initialData);
  const [interestInput, setInterestInput] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      tagline: initialData?.tagline || "",
      interests: initialData?.interests || [],
    },
  });

  const interests = watch("interests") || [];

  useEffect(() => {
    if (initialData) {
      reset({
        tagline: initialData.tagline || "",
        interests: initialData.interests || [],
      });
    }
  }, [initialData, reset]);

  const handleAddInterest = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = interestInput.trim().replace(/^,+|,+$/g, "");

      if (trimmed && !interests.includes(trimmed)) {
        if (interests.length >= 10) return;
        setValue("interests", [...interests, trimmed], {
          shouldValidate: true,
        });
        setInterestInput("");
      }
    }
  };

  const handleRemoveInterest = (toRemove: string) => {
    const updated = interests.filter((item) => item !== toRemove);
    setValue("interests", updated, { shouldValidate: true });
  };

  const handleFormSubmit = async (data: ProfileFormValues) => {
    await onSubmit(data);
    if (!isEditMode) {
      reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild className="w-full col-span-2">
          <Button variant="outline" className="rounded-md w-full">
            {isEditMode ? "Edit Profile" : "Complete Profile"}
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-md font-poppins">
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? "Edit Your Profile"
              : "Welcome! Let's get you onboarded"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update your tagline and interests below. Changes will save to your listener profile."
              : "Add a tagline and tell us what topics you are interested in to personalize your experience."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-6 py-4"
        >
          <div className="space-y-2">
            <InputField
              id="tagline"
              label="Tagline (Optional)"
              placeholder="e.g., Avid listener & tech enthusiast"
              {...register("tagline")}
            />
            {errors.tagline && (
              <p className="text-xs text-red-500">{errors.tagline.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <InputField
              id="interests"
              value={interestInput}
              label="Add Interests (Press Enter or Comma to add)"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setInterestInput(e.target.value)
              }
              onKeyDown={handleAddInterest}
              placeholder="e.g., Science, Music, Gaming..."
            />

            {errors.interests && (
              <p className="text-xs text-red-500">{errors.interests.message}</p>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              {interests.map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium bg-secondary text-muted border  select-none"
                >
                  {interest}
                  <button
                    type="button"
                    onClick={() => handleRemoveInterest(interest)}
                    className="hover:text-background ml-1 focus:outline-none"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isSubmitting} className="rounded-md">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
              className="rounded-md"
            >
              {isSubmitting
                ? "Saving..."
                : isEditMode
                  ? "Save Changes"
                  : "Complete Onboarding"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
