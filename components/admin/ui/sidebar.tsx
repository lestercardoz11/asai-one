"use client";

import type { ReactElement, SVGProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/logout-button";
import {
  GridIcon,
  BoxIcon,
  ReceiptIcon,
  FileTextIcon,
  UserIcon,
} from "@/components/icons";

type Item = { href: string; label: string; Icon: (p: SVGProps<SVGSVGElement>) => ReactElement };

const GROUPS: { heading: string; items: Item[] }[] = [
  { heading: "Overview", items: [{ href: "/admin", label: "Dashboard", Icon: GridIcon }] },
  {
    heading: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", Icon: BoxIcon },
      { href: "/admin/content", label: "Content", Icon: FileTextIcon },
    ],
  },
  {
    heading: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", Icon: ReceiptIcon },
      { href: "/admin/customers", label: "Customers", Icon: UserIcon },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <p className="type-mono text-[10px] text-navy-200">ASAI.One</p>
        <p className="type-condensed text-sm text-white">Admin</p>
      </div>
      <nav className="flex flex-1 flex-col gap-5 px-3 pb-4" aria-label="Admin">
        {GROUPS.map((g) => (
          <div key={g.heading}>
            <p className="px-2.5 pb-1.5 type-mono text-[9px] uppercase tracking-wider text-navy-300">
              {g.heading}
            </p>
            <div className="flex flex-wrap gap-1 lg:flex-col">
              {g.items.map(({ href, label, Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex items-center gap-2.5 px-2.5 py-2 type-condensed text-xs transition-colors",
                      active
                        ? "bg-navy-800 text-white"
                        : "text-navy-200 hover:bg-navy-800 hover:text-white",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="px-3 pb-5">
        <LogoutButton className="inline-flex items-center px-2.5 py-2 type-mono text-[10px] text-navy-200 transition-colors hover:text-white" />
      </div>
    </div>
  );
}
