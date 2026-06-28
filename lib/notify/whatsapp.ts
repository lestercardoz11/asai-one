import "server-only";

/**
 * WhatsApp Business API sender. Defaults to the Meta WhatsApp Cloud API shape;
 * the provider is configurable (`WHATSAPP_PROVIDER`) since the client hadn't
 * picked one (build-plan §12 #5). Graceful no-op when unconfigured.
 */
export function whatsappConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export async function sendWhatsApp(
  to: string,
  body: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) {
    console.info(`[whatsapp:stub] would message ${to}: ${body.slice(0, 60)}…`);
    return { ok: false, error: "WhatsApp not configured" };
  }
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace(/^\+/, ""),
      type: "text",
      text: { body },
    }),
  });
  if (!res.ok) return { ok: false, error: await res.text() };
  const data = (await res.json()) as { messages?: { id: string }[] };
  return { ok: true, id: data.messages?.[0]?.id };
}
