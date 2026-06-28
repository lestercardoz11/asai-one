"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/user";

export type WishlistToggle = { ok: boolean; saved: boolean; message?: string };
export type WishlistState = { isAuthed: boolean; saved: boolean };

/**
 * Add or remove a product from the signed-in user's wishlist. RLS scopes every
 * read/write to the caller (`auth.uid() = user_id`); the unique
 * (user_id, product_id) constraint keeps toggling idempotent.
 */
export async function toggleWishlist(productId: string): Promise<WishlistToggle> {
  const user = await getUser();
  if (!user) return { ok: false, saved: false, message: "Please log in to save items." };
  if (!productId) return { ok: false, saved: false, message: "Something went wrong." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("wishlist")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("wishlist").delete().eq("id", existing.id);
    if (error) {
      console.error("wishlist:remove", error);
      return { ok: false, saved: true, message: "Couldn't update your saved items." };
    }
    revalidatePath("/wishlist");
    return { ok: true, saved: false };
  }

  const { error } = await supabase
    .from("wishlist")
    .insert({ user_id: user.id, product_id: productId });
  if (error) {
    console.error("wishlist:add", error);
    return { ok: false, saved: false, message: "Couldn't update your saved items." };
  }
  revalidatePath("/wishlist");
  return { ok: true, saved: true };
}

/**
 * Resolve the wishlist state for one product. Called by the wishlist button to
 * self-hydrate, so product pages can stay statically rendered (no cookie read
 * in the page itself).
 */
export async function getWishlistState(productId: string): Promise<WishlistState> {
  const user = await getUser();
  if (!user) return { isAuthed: false, saved: false };
  const supabase = await createClient();
  const { data } = await supabase
    .from("wishlist")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();
  return { isAuthed: true, saved: Boolean(data) };
}
