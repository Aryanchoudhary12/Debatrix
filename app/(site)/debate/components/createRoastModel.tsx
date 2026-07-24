"use client";
import React from "react";
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
import z from "zod";
import { TbMessage2Plus } from "react-icons/tb";
import toast from "react-hot-toast";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useSession } from "next-auth/react";
const roastSchema = z.object({
  title: z
    .string()
    .min(10, "Title is required and must be at least 10 characters long"),
});

interface OnBoardModelProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

const CREATE_ROAST = gql`
  mutation createRoast($title: String!, $userId:String!) {
    createRoast(title: $title, userId: $userId){
        id
        title
    }
  }
`;
function CreateRoastModel({
  open,
  isOpen,
  onOpenChange,
  trigger,
}: OnBoardModelProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof roastSchema>>({
    resolver: zodResolver(roastSchema),
    defaultValues: {
      title: "",
    },
  });
  const { data: session } = useSession();
  const [createRoast] = useMutation(CREATE_ROAST);
  const handleFormSubmit = async (data: z.infer<typeof roastSchema>) => {
    try {
      await createRoast({
        variables: {
          title: data.title,
          userId: session?.user?.id,
        },
      });
      toast.success("Roast created successfully");
    } catch (error) {
      console.error("Error creating roast:", error);
      toast.error("Failed to create roast. Please try again.");
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild className="w-full col-span-2">
          <Button
            variant="secondary"
            className="mt-4 w-full flex items-center justify-center gap-2 rounded-sm"
          >
            <TbMessage2Plus className="size-4 shrink-0" />
            {open && (
              <span className="font-poppins text-sm font-semibold">
                New Roast
              </span>
            )}
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-md font-poppins">
        <DialogHeader>
          <DialogTitle>Create a Roast</DialogTitle>

          <DialogDescription>
            Enter a title for your roast. It should be at least 10 characters
            long.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-6 py-4"
        >
          <div className="space-y-2">
            <InputField
              id="title"
              label="Title"
              placeholder="e.g., My First Roast"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button
                type="button"
                variant="secondary"
                disabled={isSubmitting}
                className="rounded-md"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
              className="rounded-md"
            >
              Create Roast
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateRoastModel;
