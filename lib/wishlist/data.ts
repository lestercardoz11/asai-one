import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/user";
import { getProductById } from "@/lib/data";
import type { Product } from "@/lib/types";

/**
 * The signed-in user's saved products, newest first. Wishlist rows store only a
 * product_id; we hydrate each to a domain Product and drop any that are no
 * longer shoppable (unpublished / deleted), so the page never shows dead items.
 */
export async function getWishlistProducts(): Promise<Product[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wishlist")
    .select("product_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("wishlist:list", error);
    return [];
  }
  const products = await Promise.all((data ?? []).map((r) => getProductById(r.product_id)));
  return products.filter((p): p is Product => Boolean(p));
}
