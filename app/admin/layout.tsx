import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser, getIsAdmin } from "@/lib/auth/user";
import { LogoutButton } from "@/components/auth/logout-button";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/content", label: "Content" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login?redirect=/admin");
  if (!(await getIsAdmin())) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="type-display text-4xl text-navy-800">403 — Not authorised</h1>
        <p className="mt-3 text-ink-60">This area is for ASAI.One administrators.</p>
        <Link href="/" className="mt-6 inline-block type-condensed text-xs text-navy-500 hover:text-navy-800">
          ← Back to store
        </Link>
      </div>
    );
  }

  return (
    <div className="grid min-h-[70vh] grid-cols-1 lg:grid-cols-[220px_1fr]">
      <aside className="border-b border-ink-12 bg-navy-900 text-navy-100 lg:border-b-0 lg:border-r">
        <div className="px-5 py-5">
          <p className="type-mono text-[10px] text-navy-200">ASAI.One</p>
          <p className="type-condensed text-sm text-white">Admin</p>
        </div>
        <nav className="flex flex-wrap gap-1 px-3 pb-4 lg:flex-col">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="px-2.5 py-2 type-condensed text-xs text-navy-200 transition-colors hover:bg-navy-800 hover:text-white"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 pb-5">
          <LogoutButton className="px-2.5 py-2 type-mono text-[10px] text-navy-200 hover:text-white" />
        </div>
      </aside>
      <main className="bg-near-white px-5 py-8 sm:px-8">{children}</main>
    </div>
  );
}
