import React from "react";
import { ComicText } from "../ui/comic-text";
interface ErrorProps {
  title?: string;
  description?: string;
}
function Error({ title, description }: ErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <ComicText className="text-center mt-10 " fontSize={1.4}>
        {title || "No data available."}
      </ComicText>
      {description && (
        <p className="text-center text-sky-400 text-shadow-sky-800 text-shadow-md mt-4 uppercase font-poppins text-sm font-semibold">
          {description}
        </p>
      )}
    </div>
  );
}

export default Error;
