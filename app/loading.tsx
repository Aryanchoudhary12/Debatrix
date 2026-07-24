import React from "react";

export function ConcentricLoader() {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-4">
      <div className="flex h-16 w-16 animate-spin items-center justify-center rounded-full border-4 border-transparent border-t-blue-400 text-4xl text-blue-400">
        <div className="flex h-12 w-12 animate-spin items-center justify-center rounded-full border-4 border-transparent border-t-red-400 text-2xl text-red-400"></div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 fixed top-0 left-0 z-50 bg-muted/25 backdrop-blur-lg">
      <ConcentricLoader />
      <span className="text-base text-accent font-poppins font-semibold">Loading...</span>
    </div>
  );
}
