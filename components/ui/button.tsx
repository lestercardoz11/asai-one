import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "sale";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-navy-800 text-white border border-navy-800 hover:bg-navy-700 hover:border-navy-700",
  secondary:
    "bg-white text-navy-800 border border-ink-12 hover:border-navy-800",
  ghost:
    "bg-transparent text-navy-800 border border-transparent hover:bg-navy-50",
  sale: "bg-error text-white border border-error hover:opacity-90",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[11px]",
  md: "h-11 px-6 text-xs",
  lg: "h-14 px-8 text-sm",
};

/** Shared class recipe so <Link> can wear the same skin as <Button>. */
export function buttonVariants({
  variant = "primary",
  size = "md",
  full = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  className?: string;
} = {}): string {
  return cn(
    "type-condensed inline-flex select-none items-center justify-center gap-2 whitespace-nowrap",
    "transition-[background-color,border-color,transform,opacity] duration-150 ease-out",
    "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40",
    variants[variant],
    sizes[size],
    full && "w-full",
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, full, className, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={buttonVariants({ variant, size, full, className })}
      {...props}
    />
  ),
);
Button.displayName = "Button";
