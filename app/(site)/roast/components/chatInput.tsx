"use client";
import Button from "@/app/components/ui/button";
import InputField from "@/app/components/ui/inputField";
import { FaFire } from "react-icons/fa";
import { useForm } from "react-hook-form";
interface ChatInputProps {
  onSubmit: (msg: string) => void;
}
export const ChatInput: React.FC<ChatInputProps> = ({ onSubmit }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const content = watch("content", "");
  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit(data.content))}
      className="w-full flex items-center gap-2 p-2 px-4 border-t border-primary/25 "
    >
      <InputField
        label=""
        type="text"
        {...register("content", {
          required: true,
        })}
        placeholder="Type your next flawed argument..."
        className="w-full rounded-sm"
      />
      <Button
        type="submit"
        variant="secondary"
        className="mt-1.5 h-11 rounded-sm"
        disabled={!content.trim() || isSubmitting}
        loading={isSubmitting}
      >
        <FaFire className="size-5" />
      </Button>
    </form>
  );
};
