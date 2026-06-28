"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart/cart-context";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "@/components/auth/logout-button";
import { Logo } from "@/components/shell/logo";
import {
  CartIcon,
  MenuIcon,
  CloseIcon,
  UserIcon,
  SearchIcon,
  ArrowRightIcon,
} from "@/components/icons";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "About Us", href: "/about" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { itemCount, ready } = useCart();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const closeDrawer = () => setOpen(false);

  // Auth state resolved client-side so the layout stays statically rendered.
  useEffect(() => {
    const supabase = createClient();
    const roleOf = (u: { app_metadata?: Record<string, unknown> } | null | undefined) =>
      (u?.app_metadata?.role as string | undefined) === "admin";
    supabase.auth.getUser().then(({ data }) => {
      setAuthed(!!data.user);
      setIsAdmin(roleOf(data.user));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session?.user);
      setIsAdmin(roleOf(session?.user));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Lock scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the user dropdown on outside click or Escape.
  useEffect(() => {
    if (!userMenuOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!userMenuRef.current?.contains(e.target as Node)) setUserMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUserMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [userMenuOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // The admin area has its own sidebar chrome — render a slim header instead of
  // the full storefront nav/cart so the two contexts feel distinct.
  if (pathname.startsWith("/admin")) {
    return (
      <header className="sticky top-0 z-50 border-b border-ink-12 bg-white/95 backdrop-blur">
        <div className="container-page flex h-14 items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="type-mono text-[11px] text-navy-500 transition-colors hover:text-navy-800"
          >
            ← Back to store
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50">
      {/* utility bar */}
      <div className="bg-navy-800 text-navy-100">
        <div className="container-page flex h-9 items-center justify-between">
          <p className="type-mono text-[10px] text-navy-200">
            Free shipping over ₹499 · Ships from Pune
          </p>
          <div className="hidden items-center gap-5 sm:flex">
            {authed ? (
              <Link href="/account" className="type-mono text-[10px] transition-colors hover:text-white">
                Track Order
              </Link>
            ) : (
              <>
                <Link href="/account" className="type-mono text-[10px] transition-colors hover:text-white">
                  Track Order
                </Link>
                <Link href="/login" className="type-mono text-[10px] transition-colors hover:text-white">
                  Login / Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* main bar */}
      <div
        className={cn(
          "border-b border-ink-12 bg-white/95 backdrop-blur transition-shadow",
          scrolled && "shadow-[0_1px_0_0_rgba(10,10,10,0.08)]",
        )}
      >
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center text-navy-800 lg:hidden"
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <MenuIcon className="h-6 w-6" />
            </button>
            <Logo />
          </div>

          {/* desktop nav */}
          <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "type-condensed relative text-xs transition-colors",
                  isActive(item.href)
                    ? "text-navy-800"
                    : "text-ink-60 hover:text-navy-800",
                )}
              >
                {item.label}
                {isActive(item.href) && (
                  <span className="absolute -bottom-[22px] left-0 h-0.5 w-full bg-navy-800" />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Link
              href="/shop"
              aria-label="Search products"
              className="grid h-10 w-10 place-items-center text-navy-800 transition-colors hover:bg-navy-50"
            >
              <SearchIcon className="h-5 w-5" />
            </Link>
            {authed ? (
              <div ref={userMenuRef} className="relative hidden sm:block">
                <button
                  type="button"
                  aria-label="Account menu"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="grid h-10 w-10 place-items-center text-navy-800 transition-colors hover:bg-navy-50"
                >
                  <UserIcon className="h-5 w-5" />
                </button>
                {userMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-1 w-44 border border-ink-12 bg-white py-1 shadow-[0_8px_24px_-8px_rgba(10,10,10,0.18)]"
                  >
                    <Link
                      href="/account"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2.5 type-condensed text-xs text-navy-800 transition-colors hover:bg-navy-50"
                    >
                      My Account
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 type-condensed text-xs text-navy-800 transition-colors hover:bg-navy-50"
                      >
                        Admin
                      </Link>
                    )}
                    <LogoutButton className="block w-full px-4 py-2.5 text-left type-condensed text-xs text-navy-800 transition-colors hover:bg-navy-50" />
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                aria-label="Log in"
                className="hidden h-10 w-10 place-items-center text-navy-800 transition-colors hover:bg-navy-50 sm:grid"
              >
                <UserIcon className="h-5 w-5" />
              </Link>
            )}
            <Link
              href="/cart"
              aria-label={`Cart, ${ready ? itemCount : 0} items`}
              className="relative grid h-10 w-10 place-items-center text-navy-800 transition-colors hover:bg-navy-50"
            >
              <CartIcon className="h-5 w-5" />
              {ready && itemCount > 0 && (
                <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center bg-navy-800 px-1 type-mono text-[9px] leading-none text-white">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-[60] lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div
          className={cn(
            "absolute inset-0 bg-navy-900/40 transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-white transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "-translate-x-full",
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="flex h-16 items-center justify-between border-b border-ink-12 px-5">
            <Logo />
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="grid h-10 w-10 place-items-center text-navy-800"
            >
              <CloseIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex flex-col p-2" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeDrawer}
                className={cn(
                  "flex items-center justify-between border-b border-ink-12 px-3 py-4 type-condensed text-sm",
                  isActive(item.href) ? "text-navy-800" : "text-ink-60",
                )}
              >
                {item.label}
                <ArrowRightIcon className="h-4 w-4 text-ink-30" />
              </Link>
            ))}
          </nav>
          <div className="mt-auto grid grid-cols-2 gap-px bg-ink-12">
            {authed ? (
              <>
                <Link href="/account" onClick={closeDrawer} className="bg-white px-3 py-4 text-center type-condensed text-xs text-navy-800">
                  Account
                </Link>
                <LogoutButton className="w-full bg-white px-3 py-4 text-center type-condensed text-xs text-navy-800" />
              </>
            ) : (
              <>
                <Link href="/login" onClick={closeDrawer} className="bg-white px-3 py-4 text-center type-condensed text-xs text-navy-800">
                  Login
                </Link>
                <Link href="/register" onClick={closeDrawer} className="bg-white px-3 py-4 text-center type-condensed text-xs text-navy-800">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
