import { createProduct } from "@/lib/admin/actions";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Card } from "@/components/admin/ui/card";
import { FormGrid, AdminField } from "@/components/admin/ui/form-grid";
import { FormActions } from "@/components/admin/ui/form-actions";
import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default async function AdminProductNew() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("sort_order");

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="New product" backHref="/admin/products" backLabel="Products" />
      <Card>
        <form action={createProduct}>
          <FormGrid>
            <AdminField label="Name" required span="full">
              <Input name="name" required />
            </AdminField>
            <AdminField label="Web address (slug)" required span="half">
              <Input name="slug" required placeholder="asai-product-name" />
            </AdminField>
            <AdminField label="Stock code (SKU)" required span="half">
              <Input name="sku" required />
            </AdminField>
            <AdminField label="Category" required span="half">
              <Select name="category_id" required defaultValue="">
                <option value="" disabled>
                  Select a category…
                </option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </AdminField>
            <AdminField
              label="Price (₹)"
              required
              span="half"
              hint="In rupees. You can add variants, stock and images after creating."
            >
              <Input name="price_rupees" type="number" min={0} step="0.01" placeholder="e.g. 299" required />
            </AdminField>
          </FormGrid>
          <FormActions>
            <Button type="submit">Create product</Button>
          </FormActions>
        </form>
      </Card>
    </div>
  );
}
