import React from "react";
import { ImSpinner9 } from "react-icons/im";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "secondary";
  size?: "small" | "medium" | "large";
  className?: string;
  loading?: boolean;
}
function Button({ className, variant, children, loading = false, ...props }: ButtonProps) {
  const variantClasses = {
        default: "bg-primary text-white hover:bg-[#27548A] transition-colors duration-300 whitespace-nowrap",
        outline:
          "backdrop-blur-md border transition-colors overflow-hidden bg-gradient-to-t border-r-0 duration-200 whitespace-nowrap from-muted/10 to-primary/15 text-foreground hover:text-secondary border-primary/30 after:inset-0 after:absolute after:rounded-[inherit] after:bg-gradient-to-r after:from-transparent after:from-40% after:via-primary/15 after:to-muted/25 after:via-70% after:shadow-[hsl(var(--foreground)/0.15)_0px_1px_0px_inset] z-20 before:absolute before:w-[5px] hover:before:translate-x-full before:transition-all before:duration-200 before:h-[60%] before:bg-primary before:right-0 before:rounded-l before:shadow-[-2px_0_10px_var(--primary)] z-10",
        secondary: "bg-accent text-muted hover:bg-secondary transition-colors duration-300 whitespace-nowrap",
      };
  const sizeClasses = {
    small: "px-3 py-1.5 text-xs",
    medium: "px-4 py-2.5 text-sm",
    large: "px-6 py-3 text-base",
  };
  return (
    <button
      {...props}
      className={`${variantClasses[variant || "default"]} ${sizeClasses[props.size || "medium"]} rounded-full font-poppins font-semibold flex items-center justify-center relative  ${className}`}
    >
      {loading ? <ImSpinner9 className="animate-spin" /> : children}
    </button>
  );
}

export default Button;
