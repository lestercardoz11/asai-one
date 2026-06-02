import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "@/components/icons";

const fieldBase =
  "w-full border bg-white px-3.5 text-[15px] text-ink placeholder:text-ink-30 " +
  "transition-colors duration-150 focus:border-navy-500 focus:outline-none " +
  "focus-visible:outline-none aria-[invalid=true]:border-error disabled:bg-grey-100";

/* ── Label + error wrapper ──────────────────────────────────────────────────── */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="type-mono text-ink-60">
          {label}
          {required && <span className="text-error"> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="type-mono text-[10px] text-error">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-30">{hint}</p>
      ) : null}
    </div>
  );
}

/* ── Input ──────────────────────────────────────────────────────────────────── */
export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(fieldBase, "h-12", className)} {...props} />
));
Input.displayName = "Input";

/* ── Textarea ───────────────────────────────────────────────────────────────── */
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(fieldBase, "min-h-28 resize-y py-3 leading-relaxed", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

/* ── Select ─────────────────────────────────────────────────────────────────── */
export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(fieldBase, "h-12 appearance-none pr-10", className)}
      {...props}
    >
      {children}
    </select>
    <ChevronDownIcon
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-60"
      aria-hidden
    />
  </div>
));
Select.displayName = "Select";

/** Convenience: a Field with a labelled Input, wiring ids + aria. */
export function LabeledInput({
  label,
  error,
  hint,
  required,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <Field
      label={label}
      htmlFor={id}
      error={error}
      hint={hint}
      required={required}
      className={className}
    >
      <Input
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        {...props}
      />
    </Field>
  );
}
