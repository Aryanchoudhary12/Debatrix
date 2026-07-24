import React from "react";
import { cn } from "@/app/lib/utils";
type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  className?: string;
};
function InputField({ label, className, ...props }: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label htmlFor={props.name} className="text-sm font-medium text-secondary">
        {label}
      </label>
      <input
        id={props.name}
        autoComplete="off"
        {...props}
        className={cn(
          "bg-muted/50 backdrop-blur-lg border border-secondary/15 p-2 px-4 rounded-full text-sm font-poppins h-12 text-secondary focus:outline-0 focus-within:ring-1 focus-within:ring-primary placeholder:text-secondary/75 focus-within:placeholder:text-accent transition-all duration-200",
          className,
        )}
      />
    </div>
  );
}

export default InputField;
