"use client";
import React from "react";
import Button from "@/app/components/ui/button";
import InputField from "@/app/components/ui/inputField";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  debateSchema,
  DebateSchemaType,
} from "@/app/schema/debateSchema/debateSchema";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import toast from "react-hot-toast";
const CREATE_DEBATE = gql`
  mutation CreateDebate($title: String!, $currentUserId: String!) {
    createDebate(title: $title, CurrentUserId: $currentUserId) {
      id
      title
    }
  }
`;
function page() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DebateSchemaType>({
    resolver: zodResolver(debateSchema),
    defaultValues: {
      title: "",
    },
  });
  const router = useRouter();
  const { data: session } = useSession();
  const [createDebate] = useMutation(CREATE_DEBATE, {
    onCompleted: (data: any) => {
      router.push(`/debate/${data.createDebate.id}`);
    },
  });

  const onSubmit = async (data: { title: string }) => {
    try {
      if (!session?.user?.id) {
        toast.error("User not authenticated");
        return;
      }
      await createDebate({
        variables: {
          title: data.title,
          currentUserId: session.user.id,
        },
      });
      toast.success("Debate created successfully");
    } catch (error) {
      toast.error("Error on creating debate");
      console.error("Error on creating debate:", error);
    }
  };
  return (
    <div className="min-h-screen pt-20 p-6 flex flex-col items-center justify-center w-full">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-accent mb-2 font-montserrat">
          Create a New Debate
        </h1>
        <p className="text-secondary font-poppins text-sm">
          Start a new discussion by entering a title for your debate.
        </p>
      </div>
      <form
        action=""
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-lg p-6 flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1">
          <InputField
            label="Debate Title"
            {...register("title")}
            className="rounded-sm"
            placeholder="Enter debate title"
          />
          {errors.title && (
            <span className="text-red-500 text-xs font-poppins font-medium">
              {errors.title.message}
            </span>
          )}
        </div>
        <Button
          variant="secondary"
          className="rounded-sm w-full"
          type="submit"
          disabled={isSubmitting}
          loading={isSubmitting}
        >
          Create Debate
        </Button>
      </form>
    </div>
  );
}

export default page;
