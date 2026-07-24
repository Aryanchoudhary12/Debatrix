"use client";
import { useState } from "react";
import InputField from "@/app/components/ui/inputField";
import { useForm } from "react-hook-form";
import {
  RegisterSchema,
  registerSchema,
} from "@/app/schema/authSchema/registerSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@/app/components/ui/button";
import Link from "next/link";
import { axiosInstance } from "@/app/lib/axiosInstance";
import toast from "react-hot-toast";
import { signIn } from "next-auth/react";
import { FaGoogle } from "react-icons/fa";

function Register() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });
  const onSubmit = async (data: RegisterSchema) => {
    try {
      setIsSubmitting(true);
      const response = await axiosInstance.post("/register", data);
      toast.success("User registered successfully!");
    } catch (error) {
      toast.error(
        `Failed to register user. ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      console.error("Error occurred while registering user:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className=" flex flex-col items-center justify-center p-6 pt-20 w-full h-full min-h-screen">
      <div className="flex flex-col items-center justify-center gap-2">
        <h1 className="text-3xl font-bold font-montserrat">Get Started Now</h1>
        <p className="text-secondary font-poppins text-sm font-medium">
          Enter your credentials to create an account
        </p>
      </div>

      <form
        action=""
        className="flex flex-col gap-6 max-w-lg w-full mt-10 h-fit"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div>
          <InputField
            label="Name"
            type="text"
            placeholder="Username"
            {...register("name")}
            className="rounded-sm"
          />
          <span className="text-primary text-xs font-poppins font-medium">
            {errors.name?.message}
          </span>
        </div>
        <div>
          <InputField
            label="Email"
            type="email"
            placeholder="Email"
            {...register("email")}
            className="rounded-sm"
          />
          <span className="text-primary text-xs font-poppins font-medium">
            {errors.email?.message}
          </span>
        </div>
        <div>
          <InputField
            label="Password"
            type="password"
            placeholder="Password"
            {...register("password")}
            className="rounded-sm"
          />
          <span className="text-primary text-xs font-poppins font-medium">
            {errors.password?.message}
          </span>
        </div>
        <Button
          type="submit"
          className="rounded-sm h-11"
          size="medium"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Register
        </Button>
      </form>
      <Button
        variant="outline"
        className="rounded-sm h-11 mt-4 w-full max-w-lg gap-4"
        size="medium"
        onClick={() => signIn("google")}
      >
        <FaGoogle />
        Sign in with Google
      </Button>
      <span className="text-secondary text-sm font-poppins font-medium mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-semibold">
          Login
        </Link>
      </span>
    </div>
  );
}

export default Register;
