import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { setAdminRole } from "@/lib/admin/actions";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Card } from "@/components/admin/ui/card";

export default async function AdminCustomers() {
  const supabase = await createClient();
  // Admin status lives in the JWT `app_metadata.role` claim (the `admin_roles`
  // table was dropped). Read it from the service-role user listing.
  const admin = createAdminClient();
  const [{ data: profiles }, { data: usersData }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, phone, created_at").order("created_at", { ascending: false }).limit(200),
    admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
  ]);
  const adminIds = new Set(
    (usersData?.users ?? [])
      .filter((u) => (u.app_metadata as { role?: string } | null)?.role === "admin")
      .map((u) => u.id),
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Customers"
        description="Grant or revoke admin access. Admin status takes effect on the user's next sign-in."
      />
      <Card padded={false}>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-12 text-left type-mono text-[10px] uppercase text-ink-30">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-12">
            {(profiles ?? []).map((p) => {
              const isAdmin = adminIds.has(p.id);
              return (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-navy-800">{p.full_name ?? "—"}</td>
                  <td className="px-4 py-3 text-[13px] text-ink-60">{p.email ?? p.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`type-mono text-[10px] ${isAdmin ? "text-navy-500" : "text-ink-30"}`}>
                      {isAdmin ? "ADMIN" : "CUSTOMER"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={setAdminRole}>
                      <input type="hidden" name="user_id" value={p.id} />
                      <input type="hidden" name="make_admin" value={isAdmin ? "false" : "true"} />
                      <button type="submit" className="type-condensed text-xs text-navy-500 hover:text-navy-800">
                        {isAdmin ? "Revoke admin" : "Make admin"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </Card>
    </div>
  );
}
