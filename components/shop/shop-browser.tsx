"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/shop/product-card";
import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { SearchIcon, FilterIcon, CloseIcon } from "@/components/icons";

type Sort = "featured" | "price-asc" | "price-desc" | "rating" | "new";
type PriceBucket = "all" | "under300" | "mid" | "premium";

const SORTS: { value: Sort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "new", label: "Newest" },
];

const PRICE_BUCKETS: { value: PriceBucket; label: string }[] = [
  { value: "all", label: "Any price" },
  { value: "under300", label: "Under ₹300" },
  { value: "mid", label: "₹300 – ₹999" },
  { value: "premium", label: "₹1,000 & above" },
];

function minPrice(p: Product) {
  return Math.min(...p.variants.map((v) => v.price));
}

export function ShopBrowser({
  products,
  initialSort = "featured",
  initialQuery = "",
}: {
  products: Product[];
  initialSort?: Sort;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<Sort>(initialSort);
  const [price, setPrice] = useState<PriceBucket>("all");
  const [bestOnly, setBestOnly] = useState(initialSort === "rating");
  const [newOnly, setNewOnly] = useState(initialSort === "new");
  const [returnableOnly, setReturnableOnly] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter((p) => {
      if (q && !(p.title.toLowerCase().includes(q) || p.shortDescription.toLowerCase().includes(q)))
        return false;
      if (bestOnly && !p.isBestSeller) return false;
      if (newOnly && !p.isNew) return false;
      if (returnableOnly && p.returnPolicy !== "returnable") return false;
      const mp = minPrice(p);
      if (price === "under300" && mp >= 30000) return false;
      if (price === "mid" && (mp < 30000 || mp >= 99900)) return false;
      if (price === "premium" && mp < 99900) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "price-asc":
          return minPrice(a) - minPrice(b);
        case "price-desc":
          return minPrice(b) - minPrice(a);
        case "rating":
          return b.reviewSummary.rating - a.reviewSummary.rating;
        case "new":
          return Number(b.isNew) - Number(a.isNew);
        default:
          return (
            Number(b.isBestSeller) * 2 + Number(b.isNew) -
            (Number(a.isBestSeller) * 2 + Number(a.isNew))
          );
      }
    });
    return list;
  }, [products, query, sort, price, bestOnly, newOnly, returnableOnly]);

  const filters = (
    <div className="flex flex-col gap-8">
      <FilterGroup title="Price">
        {PRICE_BUCKETS.map((b) => (
          <Radio
            key={b.value}
            name="price"
            label={b.label}
            checked={price === b.value}
            onChange={() => setPrice(b.value)}
          />
        ))}
      </FilterGroup>
      <FilterGroup title="Collections">
        <Check label="Best Sellers" checked={bestOnly} onChange={setBestOnly} />
        <Check label="New Arrivals" checked={newOnly} onChange={setNewOnly} />
      </FilterGroup>
      <FilterGroup title="Returns">
        <Check label="Returnable only" checked={returnableOnly} onChange={setReturnableOnly} />
      </FilterGroup>
      <button
        type="button"
        onClick={() => {
          setPrice("all");
          setBestOnly(false);
          setNewOnly(false);
          setReturnableOnly(false);
          setQuery("");
        }}
        className="type-condensed self-start text-[11px] text-navy-500 underline-offset-4 hover:underline"
      >
        Clear all
      </button>
    </div>
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
      {/* desktop sidebar */}
      <aside className="hidden lg:block">
        <h2 className="type-condensed mb-6 text-xs text-navy-800">Filters</h2>
        {filters}
      </aside>

      <div>
        {/* top bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-30" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search essentials…"
              aria-label="Search products"
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="lg:hidden"
              onClick={() => setDrawerOpen(true)}
            >
              <FilterIcon className="h-4 w-4" /> Filters
            </Button>
            <label className="sr-only" htmlFor="sort">Sort</label>
            <Select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="sm:w-56"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <p className="type-mono mt-4 text-ink-30">
          {results.length} {results.length === 1 ? "product" : "products"}
        </p>

        {/* grid */}
        {results.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 3} />
            ))}
          </div>
        ) : (
          <div className="mt-10 border border-ink-12 bg-white p-12 text-center">
            <p className="type-condensed text-sm text-navy-800">No matches</p>
            <p className="mt-2 text-sm text-ink-60">
              Try a different search or clear your filters.
            </p>
          </div>
        )}
      </div>

      {/* mobile filter drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-navy-900/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-white">
            <div className="flex h-16 items-center justify-between border-b border-ink-12 px-5">
              <h2 className="type-condensed text-sm text-navy-800">Filters</h2>
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setDrawerOpen(false)}
                className="grid h-10 w-10 place-items-center text-navy-800"
              >
                <CloseIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{filters}</div>
            <div className="border-t border-ink-12 p-4">
              <Button full onClick={() => setDrawerOpen(false)}>
                Show {results.length} results
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="type-mono mb-3 text-ink-60">{title}</h3>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function Radio({
  name,
  label,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-60">
      <span
        className={cn(
          "grid h-4 w-4 shrink-0 place-items-center border",
          checked ? "border-navy-800" : "border-ink-30",
        )}
      >
        {checked && <span className="h-2 w-2 bg-navy-800" />}
      </span>
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {label}
    </label>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-60">
      <span
        className={cn(
          "grid h-4 w-4 shrink-0 place-items-center border",
          checked ? "border-navy-800 bg-navy-800 text-white" : "border-ink-30",
        )}
      >
        {checked && <span className="text-[9px] leading-none">✓</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      {label}
    </label>
  );
}
