import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  updateProduct,
  updateInventory,
  createVariant,
  updateVariant,
  deleteVariant,
  setDefaultVariant,
  setVariantOptionValues,
  addOption,
  deleteOption,
  addOptionValue,
  deleteOptionValue,
  uploadProductImage,
  deleteProductImage,
} from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Card } from "@/components/admin/ui/card";
import { FormGrid, AdminField } from "@/components/admin/ui/form-grid";
import { FormActions } from "@/components/admin/ui/form-actions";
import { Input, Textarea } from "@/components/ui/field";

type Params = Promise<{ id: string }>;

const labelCls = "type-mono text-[10px] text-ink-30";
const sectionTitle = "type-condensed text-lg text-navy-800";

export default async function AdminProductEdit({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select(
      "id, name, slug, sku, short_description, description, price_paise, original_price_paise, tags, specs, features, compatibility, hsn_code, shipping_policy, is_returnable, return_window_days, is_active, is_featured, is_new, default_variant_id, product_options(id, name, position, product_option_values(id, value, position)), product_variants(id, sku, variant_name, price_paise, original_price_paise, weight_grams, position, is_active, inventory(quantity), variant_option_values(option_value_id)), product_images(id, url, alt, position, is_primary)",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!product) notFound();

  const options = [...(product.product_options ?? [])].sort((a, b) => a.position - b.position);
  const variants = [...(product.product_variants ?? [])].sort((a, b) => a.position - b.position);
  const images = [...(product.product_images ?? [])].sort((a, b) => a.position - b.position);
  // Specs are shown one per line as "Label: Value" (no JSON for the admin).
  const specs = Array.isArray(product.specs)
    ? (product.specs as { label: string; value: string }[])
    : [];
  const specsText = specs.map((s) => `${s.label}: ${s.value}`).join("\n");
  // Money is shown/entered in rupees; helper to seed a rupee field from paise.
  const toRupees = (paise: number | null | undefined) => (paise != null ? paise / 100 : "");

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={product.name}
        backHref="/admin/products"
        backLabel="Products"
        actions={<span className="type-mono text-[10px] text-ink-30">{product.sku}</span>}
      />

      {/* ───────────────────────────── Details ───────────────────────────── */}
      <section className="mt-2">
        <Card title="Details">
          <form action={updateProduct}>
            <input type="hidden" name="id" value={product.id} />
            <FormGrid>
              <AdminField label="Name" required span="half">
                <Input name="name" defaultValue={product.name} required />
              </AdminField>
              <AdminField
                label="Web address (slug)"
                required
                span="half"
                hint="Lowercase words-with-dashes — this appears in the product's link."
              >
                <Input name="slug" defaultValue={product.slug} required />
              </AdminField>
              <AdminField label="Short description" span="full">
                <Input name="short_description" defaultValue={product.short_description ?? ""} />
              </AdminField>
              <AdminField label="Description" span="full">
                <Textarea name="description" defaultValue={product.description ?? ""} rows={4} />
              </AdminField>
              <AdminField label="Price (₹)" required span="half" hint="Selling price in rupees, e.g. 299 or 299.50.">
                <Input name="price_rupees" type="number" min={0} step="0.01" defaultValue={product.price_paise / 100} required />
              </AdminField>
              <AdminField label="Original price (₹)" span="half" hint="Optional. Shown struck-through to display a discount.">
                <Input name="original_price_rupees" type="number" min={0} step="0.01" defaultValue={toRupees(product.original_price_paise)} />
              </AdminField>
              <AdminField label="Tags (comma-separated)" span="full">
                <Input name="tags" defaultValue={(product.tags ?? []).join(", ")} />
              </AdminField>
              <AdminField label="Features (one per line)" span="full">
                <Textarea name="features" defaultValue={(product.features ?? []).join("\n")} rows={4} />
              </AdminField>
              <AdminField label="Specifications" span="full" hint={`One per line, written as "Label: Value".`}>
                <Textarea name="specs" defaultValue={specsText} rows={6} placeholder={"Material: Cotton\nWeight: 90 g"} />
              </AdminField>
              <AdminField label="Compatibility" span="full">
                <Input name="compatibility" defaultValue={product.compatibility ?? ""} />
              </AdminField>
              <AdminField label="HSN code" span="half">
                <Input name="hsn_code" defaultValue={product.hsn_code ?? ""} />
              </AdminField>
              <AdminField label="Return window (days)" span="half">
                <Input name="return_window_days" type="number" min={0} defaultValue={product.return_window_days} />
              </AdminField>
              <AdminField label="Shipping policy" span="full">
                <Textarea name="shipping_policy" defaultValue={product.shipping_policy ?? ""} rows={2} />
              </AdminField>
              <div className="flex flex-wrap gap-4 text-sm sm:col-span-2">
                <Flag name="is_active" label="Live" checked={product.is_active} />
                <Flag name="is_featured" label="Best seller" checked={product.is_featured} />
                <Flag name="is_new" label="New" checked={product.is_new} />
                <Flag name="is_returnable" label="Returnable" checked={product.is_returnable} />
              </div>
            </FormGrid>
            <FormActions sticky>
              <Button type="submit">Save details</Button>
            </FormActions>
          </form>
        </Card>
      </section>

      {/* ─────────────────────── Options & values ─────────────────────────── */}
      <section className="mt-10">
        <h2 className={sectionTitle}>Options &amp; values</h2>
        <div className="mt-3 flex flex-col gap-px border border-ink-12 bg-ink-12">
          {options.map((opt) => {
            const values = [...(opt.product_option_values ?? [])].sort((a, b) => a.position - b.position);
            return (
              <div key={opt.id} className="bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="type-condensed text-sm text-navy-800">{opt.name}</p>
                  <form action={deleteOption}>
                    <input type="hidden" name="option_id" value={opt.id} />
                    <input type="hidden" name="product_id" value={product.id} />
                    <button type="submit" className="type-condensed text-xs text-error hover:opacity-80">
                      Remove option
                    </button>
                  </form>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {values.map((v) => (
                    <span key={v.id} className="inline-flex items-center gap-2 border border-ink-12 bg-near-white px-2 py-1 text-xs text-navy-800">
                      {v.value}
                      <form action={deleteOptionValue}>
                        <input type="hidden" name="value_id" value={v.id} />
                        <input type="hidden" name="product_id" value={product.id} />
                        <button type="submit" className="text-error hover:opacity-80" aria-label={`Remove ${v.value}`}>
                          ×
                        </button>
                      </form>
                    </span>
                  ))}
                </div>
                <form action={addOptionValue} className="mt-3 flex items-end gap-2">
                  <input type="hidden" name="option_id" value={opt.id} />
                  <input type="hidden" name="product_id" value={product.id} />
                  <input name="value" placeholder="Add value…" required className="w-48 border border-ink-12 px-2 py-1.5 text-sm" />
                  <Button type="submit" size="sm" variant="secondary">
                    Add value
                  </Button>
                </form>
              </div>
            );
          })}
          <form action={addOption} className="flex items-end gap-2 bg-white p-4">
            <input type="hidden" name="product_id" value={product.id} />
            <label className="block">
              <span className={labelCls}>New option (e.g. Pack size)</span>
              <input name="name" required className="mt-1 w-56 border border-ink-12 px-2 py-1.5 text-sm" />
            </label>
            <Button type="submit" size="sm" variant="secondary">
              Add option
            </Button>
          </form>
        </div>
      </section>

      {/* ───────────────────────────── Variants ───────────────────────────── */}
      <section className="mt-10">
        <h2 className={sectionTitle}>Variants</h2>
        <div className="mt-3 flex flex-col gap-4">
          {variants.map((v) => {
            const stock = (v.inventory ?? []).reduce((q, i) => q + (i.quantity ?? 0), 0);
            const pinned = new Set((v.variant_option_values ?? []).map((x) => x.option_value_id));
            const isDefault = product.default_variant_id === v.id;
            return (
              <div key={v.id} className="border border-ink-12 bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="type-condensed text-sm text-navy-800">
                    {v.variant_name ?? v.sku}
                    {isDefault && <span className="ml-2 type-mono text-[10px] text-navy-500">DEFAULT</span>}
                  </p>
                  <div className="flex items-center gap-4">
                    {!isDefault && (
                      <form action={setDefaultVariant}>
                        <input type="hidden" name="product_id" value={product.id} />
                        <input type="hidden" name="variant_id" value={v.id} />
                        <button type="submit" className="type-condensed text-xs text-navy-500 hover:text-navy-800">
                          Make default
                        </button>
                      </form>
                    )}
                    <form action={deleteVariant}>
                      <input type="hidden" name="variant_id" value={v.id} />
                      <input type="hidden" name="product_id" value={product.id} />
                      <button type="submit" className="type-condensed text-xs text-error hover:opacity-80">
                        Delete
                      </button>
                    </form>
                  </div>
                </div>

                {/* Option-value assignment */}
                {options.length > 0 && (
                  <form action={setVariantOptionValues} className="mt-4 flex flex-wrap items-end gap-3">
                    <input type="hidden" name="variant_id" value={v.id} />
                    <input type="hidden" name="product_id" value={product.id} />
                    {options.map((opt) => {
                      const values = [...(opt.product_option_values ?? [])].sort((a, b) => a.position - b.position);
                      const selected = values.find((val) => pinned.has(val.id))?.id ?? "";
                      return (
                        <label key={opt.id} className="block">
                          <span className={labelCls}>{opt.name}</span>
                          <select name="option_value_id" defaultValue={selected} className="mt-1 block w-40 border border-ink-12 px-2 py-1.5 text-sm">
                            <option value="">—</option>
                            {values.map((val) => (
                              <option key={val.id} value={val.id}>
                                {val.value}
                              </option>
                            ))}
                          </select>
                        </label>
                      );
                    })}
                    <Button type="submit" size="sm" variant="secondary">
                      Save options
                    </Button>
                  </form>
                )}

                {/* Variant detail fields */}
                <form action={updateVariant} className="mt-4 flex flex-wrap items-end gap-3">
                  <input type="hidden" name="variant_id" value={v.id} />
                  <label className="block">
                    <span className={labelCls}>SKU</span>
                    <input name="sku" defaultValue={v.sku} required className="mt-1 w-36 border border-ink-12 px-2 py-1.5 text-sm" />
                  </label>
                  <label className="block">
                    <span className={labelCls}>Name</span>
                    <input name="variant_name" defaultValue={v.variant_name ?? ""} className="mt-1 w-40 border border-ink-12 px-2 py-1.5 text-sm" />
                  </label>
                  <label className="block">
                    <span className={labelCls}>Price (₹)</span>
                    <input name="price_rupees" type="number" min={0} step="0.01" defaultValue={toRupees(v.price_paise)} placeholder="Same as product" className="mt-1 w-32 border border-ink-12 px-2 py-1.5 text-sm" />
                  </label>
                  <label className="block">
                    <span className={labelCls}>Original price (₹)</span>
                    <input name="original_price_rupees" type="number" min={0} step="0.01" defaultValue={toRupees(v.original_price_paise)} className="mt-1 w-32 border border-ink-12 px-2 py-1.5 text-sm" />
                  </label>
                  <label className="block">
                    <span className={labelCls}>Weight (g)</span>
                    <input name="weight_grams" type="number" min={0} defaultValue={v.weight_grams ?? ""} className="mt-1 w-24 border border-ink-12 px-2 py-1.5 text-sm" />
                  </label>
                  <label className="block">
                    <span className={labelCls}>Position</span>
                    <input name="position" type="number" min={0} defaultValue={v.position} className="mt-1 w-20 border border-ink-12 px-2 py-1.5 text-sm" />
                  </label>
                  <Flag name="is_active" label="Active" checked={v.is_active} />
                  <Button type="submit" size="sm" variant="secondary">
                    Save
                  </Button>
                </form>

                {/* Inventory */}
                <form action={updateInventory} className="mt-3 flex flex-wrap items-end gap-3">
                  <input type="hidden" name="variant_id" value={v.id} />
                  <label className="block">
                    <span className={labelCls}>Stock</span>
                    <input name="quantity" type="number" min={0} defaultValue={stock} className="mt-1 w-24 border border-ink-12 px-2 py-1.5 text-sm" />
                  </label>
                  <span className="type-mono text-[10px] text-ink-30">{formatINR(v.price_paise ?? product.price_paise)}</span>
                  <Button type="submit" size="sm" variant="secondary">
                    Save stock
                  </Button>
                </form>
              </div>
            );
          })}

          {/* Create variant */}
          <form action={createVariant} className="flex flex-wrap items-end gap-3 border border-dashed border-ink-12 bg-near-white p-4">
            <input type="hidden" name="product_id" value={product.id} />
            <label className="block">
              <span className={labelCls}>New variant SKU</span>
              <input name="sku" required className="mt-1 w-40 border border-ink-12 px-2 py-1.5 text-sm" />
            </label>
            <label className="block">
              <span className={labelCls}>Name</span>
              <input name="variant_name" className="mt-1 w-40 border border-ink-12 px-2 py-1.5 text-sm" />
            </label>
            <label className="block">
              <span className={labelCls}>Price (₹)</span>
              <input name="price_rupees" type="number" min={0} step="0.01" placeholder="Same as product" className="mt-1 w-32 border border-ink-12 px-2 py-1.5 text-sm" />
            </label>
            <Button type="submit" size="sm">
              Add variant
            </Button>
          </form>
        </div>
      </section>

      {/* ───────────────────────────── Images ─────────────────────────────── */}
      <section className="mt-10">
        <h2 className={sectionTitle}>Images</h2>
        <div className="mt-3 flex flex-wrap gap-4">
          {images.map((img) => (
            <div key={img.id} className="border border-ink-12 bg-white p-2">
              <div className="relative h-24 w-24">
                <Image src={img.url} alt={img.alt ?? ""} fill sizes="96px" className="object-contain" />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="type-mono text-[10px] text-ink-30">{img.is_primary ? "PRIMARY" : `#${img.position}`}</span>
                <form action={deleteProductImage}>
                  <input type="hidden" name="image_id" value={img.id} />
                  <input type="hidden" name="product_id" value={product.id} />
                  <button type="submit" className="type-condensed text-xs text-error hover:opacity-80">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>

        <form action={uploadProductImage} className="mt-4 flex flex-wrap items-end gap-3 border border-ink-12 bg-white p-4">
          <input type="hidden" name="product_id" value={product.id} />
          <label className="block">
            <span className={labelCls}>File</span>
            <input name="file" type="file" accept="image/*" required className="mt-1 block text-sm" />
          </label>
          <label className="block">
            <span className={labelCls}>Alt text</span>
            <input name="alt" className="mt-1 w-48 border border-ink-12 px-2 py-1.5 text-sm" />
          </label>
          <label className="block">
            <span className={labelCls}>Position</span>
            <input name="position" type="number" min={0} defaultValue={0} className="mt-1 w-20 border border-ink-12 px-2 py-1.5 text-sm" />
          </label>
          <Flag name="is_primary" label="Primary" checked={false} />
          <Button type="submit" size="sm">
            Upload
          </Button>
        </form>
      </section>
    </div>
  );
}

function Flag({ name, label, checked }: { name: string; label: string; checked: boolean }) {
  return (
    <label className="flex items-center gap-2 text-ink-60">
      <input type="checkbox" name={name} defaultChecked={checked} className="h-4 w-4" />
      {label}
    </label>
  );
}

