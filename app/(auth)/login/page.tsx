"use client";
import React, { useState } from "react";
import InputField from "@/app/components/ui/inputField";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@/app/components/ui/button";
import Link from "next/link";
import { loginSchema, LoginSchema } from "@/app/schema/authSchema/loginSchema";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { FaGoogle } from "react-icons/fa";

function Login() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const onSubmit = async (data: LoginSchema) => {
    try {
      setIsSubmitting(true);
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });
      if (result?.error) {
        console.error("Login failed:", result.error);
        toast.error(`Login failed: ${result.error}`);
      } else {
        toast.success("Login successful!");
        router.push("/");
      }
    } catch (error) {
      console.error("Error occurred during login:", error);
      toast.error("An error occurred during login.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 pt-20 w-full h-full min-h-screen">
      <div className="flex flex-col items-center justify-center gap-2">
        <h1 className="text-3xl font-bold font-montserrat">Get Started Now</h1>
        <p className="text-secondary font-poppins text-sm font-medium">
          Enter your credentials to access your account
        </p>
      </div>

      <form
        action=""
        className="flex flex-col gap-6 max-w-lg w-full mt-10"
        onSubmit={handleSubmit(onSubmit)}
      >
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
          className="rounded-sm"
          size="medium"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Login
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
        Don't have an account?{" "}
        <Link href="/register" className="text-primary font-semibold">
          Register
        </Link>
      </span>
    </div>
  );
}

export default Login;
