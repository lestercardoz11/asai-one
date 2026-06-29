import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteProduct } from "@/lib/admin/actions";
import { formatINR } from "@/lib/format";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Card } from "@/components/admin/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default async function AdminProducts() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select(
      "id, name, slug, price_paise, is_active, is_featured, product_variants(id, inventory(quantity))",
    )
    .is("deleted_at", null)
    .order("name");

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Products"
        actions={
          <Link href="/admin/products/new" className={buttonVariants({ size: "sm" })}>
            + New product
          </Link>
        }
      />
      <Card padded={false}>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-12 text-left type-mono text-[10px] uppercase text-ink-30">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Price from</th>
              <th className="px-4 py-3">Variants</th>
              <th className="px-4 py-3">In stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-12">
            {(products ?? []).map((p) => {
              const variants = p.product_variants ?? [];
              const stock = variants.reduce(
                (s, v) => s + (v.inventory ?? []).reduce((q, i) => q + (i.quantity ?? 0), 0),
                0,
              );
              return (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-navy-800">{p.name}</td>
                  <td className="px-4 py-3 tabular-nums">{formatINR(p.price_paise)}</td>
                  <td className="px-4 py-3 tabular-nums">{variants.length}</td>
                  <td className={`px-4 py-3 tabular-nums ${stock <= 10 ? "text-error" : ""}`}>{stock}</td>
                  <td className="px-4 py-3">
                    <span className={`type-mono text-[10px] ${p.is_active ? "text-navy-500" : "text-ink-30"}`}>
                      {p.is_active ? "LIVE" : "HIDDEN"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <Link href={`/admin/products/${p.id}`} className="type-condensed text-xs text-navy-500 hover:text-navy-800">
                        Edit →
                      </Link>
                      <form action={deleteProduct}>
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" className="type-condensed text-xs text-error hover:opacity-80">
                          Delete
                        </button>
                      </form>
                    </div>
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
