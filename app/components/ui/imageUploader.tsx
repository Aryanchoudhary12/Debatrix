"use client";
import React, { useRef } from "react";
import Button from "./button";
import { BsFillCameraFill } from "react-icons/bs";
import {cn} from "@/app/lib/utils"; 
interface ImageUploaderProps extends React.InputHTMLAttributes<HTMLInputElement> {
    className?: string;
}
function ImageUploader({ className, ...props }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const handleUploadClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };
  return (
    <div >
      <Button
        onClick={handleUploadClick}
        className={cn("rounded-full", className)}
      >
        <BsFillCameraFill className="text-base" />
      </Button>
      <input
        type="file"
        ref={inputRef}
        style={{ display: "none" }}
        accept="image/*"
        {...props}
      />
    </div>
  );
}

export default ImageUploader;
