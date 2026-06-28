import "server-only";

/**
 * Resend transactional email. Graceful no-op (logs intent) when `RESEND_API_KEY`
 * is unset, so the rest of the flow works before the key lands.
 */
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export function resendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(
  msg: EmailMessage,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "ASAI.One <support@asai.one>";
  if (!key) {
    console.info(`[resend:stub] would email "${msg.subject}" → ${msg.to}`);
    return { ok: false, error: "RESEND_API_KEY not set" };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: msg.to, subject: msg.subject, html: msg.html }),
  });
  if (!res.ok) return { ok: false, error: await res.text() };
  const data = (await res.json()) as { id?: string };
  return { ok: true, id: data.id };
}
