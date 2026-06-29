import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser, getIsAdmin } from "@/lib/auth/user";
import { AdminSidebar } from "@/components/admin/ui/sidebar";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

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
        <AdminSidebar />
      </aside>
      <main className="bg-near-white px-5 py-8 sm:px-8">{children}</main>
    </div>
  );
}
