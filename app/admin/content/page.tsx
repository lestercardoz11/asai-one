import Image from "next/image";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  updateMode,
  uploadModeImage,
  removeModeImage,
  updateCmsPage,
} from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";

const fieldCls = "mt-1 w-full border border-ink-12 px-3 py-2 text-sm";
const labelCls = "type-mono text-[10px] text-ink-30";
const sectionTitle = "type-condensed text-lg text-navy-800";

function Hint({ children }: { children: ReactNode }) {
  return <span className="mt-1 block text-[11px] leading-snug text-ink-30">{children}</span>;
}

export default async function AdminContent() {
  const supabase = await createClient();
  const [{ data: modes }, { data: pages }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug, status, tagline, description, hero_image_url")
      .order("sort_order"),
    supabase
      .from("cms_pages")
      .select("id, slug, title, body_markdown, meta_title, meta_description, is_published")
      .order("slug"),
  ]);

  return (
    <div className="max-w-3xl">
      <h1 className="type-display text-4xl text-navy-800">Content</h1>
      <p className="mt-1 text-sm text-ink-60">
        Edit the commute sections and the site&rsquo;s information pages.
      </p>

      {/* ── Commute modes ─────────────────────────────────────────────────── */}
      <section className="mt-8">
        <h2 className={sectionTitle}>Commute sections</h2>
        <p className="mt-1 text-[13px] text-ink-60">
          Set each one Live or Coming soon, edit its wording, and add a banner image.
        </p>
        <div className="mt-3 flex flex-col gap-4">
          {(modes ?? []).map((m) => (
            <div key={m.id} className="border border-ink-12 bg-white p-5">
              <div className="flex flex-col gap-5 sm:flex-row">
                {/* Image */}
                <div className="w-full shrink-0 sm:w-40">
                  {m.hero_image_url ? (
                    <div className="relative aspect-[5/3] w-full border border-ink-12">
                      <Image src={m.hero_image_url} alt={m.name} fill sizes="160px" className="object-cover" />
                    </div>
                  ) : (
                    <div className="grid aspect-[5/3] w-full place-items-center border border-dashed border-ink-12 text-[11px] text-ink-30">
                      No image
                    </div>
                  )}
                  <form action={uploadModeImage} className="mt-2">
                    <input type="hidden" name="id" value={m.id} />
                    <input name="file" type="file" accept="image/*" required className="block w-full text-[11px]" />
                    <div className="mt-1 flex items-center gap-3">
                      <Button type="submit" size="sm" variant="secondary">Upload image</Button>
                    </div>
                  </form>
                  {m.hero_image_url && (
                    <form action={removeModeImage} className="mt-1">
                      <input type="hidden" name="id" value={m.id} />
                      <button type="submit" className="type-condensed text-xs text-error hover:opacity-80">
                        Remove image
                      </button>
                    </form>
                  )}
                </div>

                {/* Fields */}
                <form action={updateMode} className="flex-1">
                  <input type="hidden" name="id" value={m.id} />
                  <div className="flex items-center justify-between gap-3">
                    <span className={labelCls}>/{m.slug}</span>
                    <label className="flex items-center gap-2">
                      <span className={labelCls}>Status</span>
                      <select name="status" defaultValue={m.status} className="border border-ink-12 px-2 py-1 text-xs">
                        <option value="active">Live</option>
                        <option value="coming_soon">Coming soon</option>
                        <option value="archived">Hidden</option>
                      </select>
                    </label>
                  </div>
                  <label className="mt-3 block">
                    <span className={labelCls}>Display name</span>
                    <input name="name" defaultValue={m.name} required className={fieldCls} />
                  </label>
                  <label className="mt-3 block">
                    <span className={labelCls}>Tagline</span>
                    <input name="tagline" defaultValue={m.tagline ?? ""} className={fieldCls} />
                    <Hint>Short line shown under the name.</Hint>
                  </label>
                  <label className="mt-3 block">
                    <span className={labelCls}>Description</span>
                    <textarea name="description" defaultValue={m.description ?? ""} rows={3} className={fieldCls} />
                  </label>
                  <Button type="submit" size="sm" className="mt-3">Save section</Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CMS pages ─────────────────────────────────────────────────────── */}
      <section className="mt-12">
        <h2 className={sectionTitle}>Information pages</h2>
        <p className="mt-1 text-[13px] text-ink-60">
          The text pages on the site (About, Privacy, etc.). Untick Published to hide one.
        </p>
        <div className="mt-3 flex flex-col gap-6">
          {(pages ?? []).map((pg) => (
            <form key={pg.id} action={updateCmsPage} className="border border-ink-12 bg-white p-5">
              <input type="hidden" name="id" value={pg.id} />
              <input type="hidden" name="slug" value={pg.slug} />
              <div className="flex items-center justify-between gap-3">
                <a
                  href={`/${pg.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="type-mono text-[10px] text-navy-500 hover:underline"
                >
                  /{pg.slug} ↗
                </a>
                <label className="flex items-center gap-2 text-xs text-ink-60">
                  <input type="checkbox" name="is_published" defaultChecked={pg.is_published} className="h-4 w-4" />
                  Published
                </label>
              </div>
              <label className="mt-3 block">
                <span className={labelCls}>Title</span>
                <input name="title" defaultValue={pg.title} required className={fieldCls} />
              </label>
              <label className="mt-3 block">
                <span className={labelCls}>Page text</span>
                <textarea name="body_markdown" defaultValue={pg.body_markdown} rows={8} className={fieldCls} />
                <Hint>Supports simple formatting: **bold**, _italic_, # heading, - list.</Hint>
              </label>
              <div className="mt-3 grid grid-cols-1 gap-3">
                <label className="block">
                  <span className={labelCls}>Search title</span>
                  <input name="meta_title" defaultValue={pg.meta_title ?? ""} className={fieldCls} />
                  <Hint>Optional. Shown in Google results and the browser tab.</Hint>
                </label>
                <label className="block">
                  <span className={labelCls}>Search description</span>
                  <textarea name="meta_description" defaultValue={pg.meta_description ?? ""} rows={2} className={fieldCls} />
                </label>
              </div>
              <Button type="submit" size="sm" className="mt-3">Save page</Button>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
