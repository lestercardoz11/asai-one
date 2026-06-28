import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Field } from "@/components/ui/field";

/** The 2-column responsive admin form grid. Children are AdminFields. */
export function FormGrid({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2", className)}>
      {children}
    </div>
  );
}

/** A labelled form field inside FormGrid. `span="full"` spans both columns
 *  (default); `span="half"` occupies one. On mobile every field is full-width. */
export function AdminField({
  label,
  htmlFor,
  hint,
  error,
  required,
  span = "full",
  className,
  children,
}: {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  span?: "full" | "half";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Field
      label={label}
      htmlFor={htmlFor}
      hint={hint}
      error={error}
      required={required}
      className={cn(span === "full" && "sm:col-span-2", className)}
    >
      {children}
    </Field>
  );
}
