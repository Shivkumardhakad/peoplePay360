import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "outline";
};

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  const variants = {
    default: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-cyan-800",
    secondary: "bg-slate-200 text-slate-950 hover:bg-slate-300",
    outline: "border border-[var(--border)] bg-white text-slate-950 hover:bg-slate-100"
  };

  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
