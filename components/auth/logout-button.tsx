"use client";

import { signOut } from "@/lib/auth/actions";

/** Posts to the `signOut` Server Action (clears the session cookie, redirects). */
export function LogoutButton({
  className,
  children = "Log out",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <form action={signOut}>
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
