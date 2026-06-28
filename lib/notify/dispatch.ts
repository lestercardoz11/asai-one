import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "./resend";
import { sendWhatsApp } from "./whatsapp";
import { orderConfirmationEmail, abandonedCartEmail, abandonedCartText } from "./templates";

type AddressJson = { full_name?: string } | null;

/** Send the order-confirmation email (Resend) and log it to `notifications`. */
export async function notifyOrderConfirmed(orderId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, order_number, email, phone, total_paise, shipping_address")
    .eq("id", orderId)
    .single();
  if (!order) return;

  const { data: items } = await admin
    .from("order_items")
    .select("product_name, variant_label, quantity, total_paise")
    .eq("order_id", orderId);

  const name = (order.shipping_address as AddressJson)?.full_name ?? "there";

  if (order.email) {
    const tpl = orderConfirmationEmail({
      name,
      orderNumber: order.order_number,
      items: (items ?? []).map((i) => ({
        title: i.product_name,
        variant: i.variant_label ?? "",
        qty: i.quantity,
        lineTotal: i.total_paise,
      })),
      total: order.total_paise,
    });
    const res = await sendEmail({ to: order.email, subject: tpl.subject, html: tpl.html });
    await admin.from("notifications").insert({
      order_id: orderId,
      channel: "email",
      template_key: "order_confirmation",
      recipient: order.email,
      status: res.ok ? "sent" : "failed",
      provider_message_id: res.id ?? null,
      error_message: res.error ?? null,
      sent_at: res.ok ? new Date().toISOString() : null,
    });
  }
}

/**
 * Send an abandoned-cart reminder for a stale pending order, choosing the channel
 * by the identifier captured (email → Resend, else phone → WhatsApp). Records the
 * attempt so the cron won't re-send. Returns the channel used (or null).
 */
export async function remindAbandoned(order: {
  id: string;
  email: string | null;
  phone: string | null;
  shipping_address: AddressJson;
  itemCount: number;
}): Promise<"email" | "whatsapp" | null> {
  const admin = createAdminClient();
  const name = order.shipping_address?.full_name ?? "there";

  if (order.email) {
    const tpl = abandonedCartEmail({ name, itemCount: order.itemCount });
    const res = await sendEmail({ to: order.email, subject: tpl.subject, html: tpl.html });
    await admin.from("notifications").insert({
      order_id: order.id,
      channel: "email",
      template_key: "abandoned_cart",
      recipient: order.email,
      status: res.ok ? "sent" : "failed",
      provider_message_id: res.id ?? null,
      error_message: res.error ?? null,
      sent_at: res.ok ? new Date().toISOString() : null,
    });
    return "email";
  }

  if (order.phone) {
    const res = await sendWhatsApp(order.phone, abandonedCartText(name));
    await admin.from("notifications").insert({
      order_id: order.id,
      channel: "whatsapp",
      template_key: "abandoned_cart",
      recipient: order.phone,
      status: res.ok ? "sent" : "failed",
      provider_message_id: res.id ?? null,
      error_message: res.error ?? null,
      sent_at: res.ok ? new Date().toISOString() : null,
    });
    return "whatsapp";
  }

  return null;
}
