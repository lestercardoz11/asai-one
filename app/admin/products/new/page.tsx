import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createProduct } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";

export default async function AdminProductNew() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("sort_order");

  return (
    <div className="max-w-xl">
      <Link href="/admin/products" className="type-condensed text-xs text-navy-500 hover:text-navy-800">
        ← Products
      </Link>
      <h1 className="mt-2 type-display text-4xl text-navy-800">New product</h1>

      <form action={createProduct} className="mt-8 border border-ink-12 bg-white p-5">
        <label className="block">
          <span className="type-mono text-[10px] text-ink-30">Name</span>
          <input name="name" required className="mt-1 w-full border border-ink-12 px-3 py-2 text-sm" />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <label className="block">
            <span className="type-mono text-[10px] text-ink-30">Web address (slug)</span>
            <input name="slug" required placeholder="asai-product-name" className="mt-1 w-full border border-ink-12 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="type-mono text-[10px] text-ink-30">Stock code (SKU)</span>
            <input name="sku" required className="mt-1 w-full border border-ink-12 px-3 py-2 text-sm" />
          </label>
        </div>
        <label className="mt-4 block">
          <span className="type-mono text-[10px] text-ink-30">Category</span>
          <select name="category_id" required defaultValue="" className="mt-1 w-full border border-ink-12 px-3 py-2 text-sm">
            <option value="" disabled>
              Select a category…
            </option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-4 block">
          <span className="type-mono text-[10px] text-ink-30">Price (₹)</span>
          <input
            name="price_rupees"
            type="number"
            min={0}
            step="0.01"
            placeholder="e.g. 299"
            required
            className="mt-1 w-full border border-ink-12 px-3 py-2 text-sm"
          />
          <span className="mt-1 block text-[11px] text-ink-30">
            In rupees. You can add variants, stock and images after creating.
          </span>
        </label>
        <Button type="submit" size="sm" className="mt-5">
          Create product
        </Button>
      </form>
    </div>
  );
}
