"use client";
import React, { useState } from "react";
import Image from "next/image";
const DARK_BLUE_SHADES = [
  "bg-blue-900",
  "bg-blue-950",
  "bg-indigo-900",
  "bg-indigo-950",
  "bg-sky-900",
  "bg-sky-950",
  "bg-slate-800",
  "bg-slate-900",
  "bg-cyan-900",
  "bg-cyan-950",
];

const getBackgroundColor = (username: string): string => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % DARK_BLUE_SHADES.length;
  return DARK_BLUE_SHADES[index];
};

interface AvatarProps {
  src?: string | null;
  username: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
  xl: "w-20 h-20 text-2xl",
};

export default function Avatar({
  src,
  username,
  size = "md",
  className = "",
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const initial = username ? username.charAt(0).toUpperCase() : "?";
  const bgColorClass = getBackgroundColor(username || "default");

  const shouldShowFallback = !src || imageError;

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden font-semibold text-white select-none shrink-0 ${sizeClasses[size]} ${bgColorClass} ${className}`}
      title={username}
    >
      {shouldShowFallback ? (
        <span className="text-3xl font-montserrat">{initial}</span>
      ) : (
        <Image
          src={src}
          alt={username}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
}
