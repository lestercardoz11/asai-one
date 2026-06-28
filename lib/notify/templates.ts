/** Minimal, on-brand (MOTO navy) email templates. Inline styles for email clients. */

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://asai.one";

/** Escape user-supplied values before interpolating into email HTML. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shell(title: string, inner: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f8f7f4;font-family:Arial,Helvetica,sans-serif;color:#0a0a0a">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
    <table width="100%" style="max-width:560px;background:#ffffff;border:1px solid rgba(10,10,10,0.12)">
      <tr><td style="background:#0b1624;padding:20px 28px"><span style="color:#fff;font-size:18px;letter-spacing:2px;font-weight:bold">ASAI.ONE</span></td></tr>
      <tr><td style="padding:28px">
        <h1 style="margin:0 0 12px;font-size:22px;color:#0b1624">${title}</h1>
        ${inner}
      </td></tr>
      <tr><td style="padding:18px 28px;border-top:1px solid rgba(10,10,10,0.12);font-size:12px;color:#666">
        ASAI.One · Pune, Maharashtra · <a href="${SITE}" style="color:#1e4080">asai.one</a>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

function inr(paise: number): string {
  return "₹" + (paise / 100).toLocaleString("en-IN");
}

export function orderConfirmationEmail(args: {
  name: string;
  orderNumber: string;
  items: { title: string; variant: string; qty: number; lineTotal: number }[];
  total: number;
}): { subject: string; html: string } {
  const rows = args.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;font-size:14px">${esc(i.title)} <span style="color:#888">· ${esc(i.variant)} × ${i.qty}</span></td><td style="padding:8px 0;text-align:right;font-size:14px">${inr(i.lineTotal)}</td></tr>`,
    )
    .join("");
  const inner = `
    <p style="font-size:15px;line-height:1.6">Thanks, ${esc(args.name.split(" ")[0])} — your order is confirmed.</p>
    <p style="font-size:13px;color:#666;margin:0 0 16px">Order <strong style="color:#0b1624">${esc(args.orderNumber)}</strong></p>
    <table width="100%" style="border-top:1px solid rgba(10,10,10,0.12);border-bottom:1px solid rgba(10,10,10,0.12);margin:8px 0">${rows}</table>
    <p style="font-size:16px;text-align:right;margin:12px 0"><strong>Total ${inr(args.total)}</strong></p>
    <a href="${SITE}/account" style="display:inline-block;background:#0b1624;color:#fff;padding:12px 20px;text-decoration:none;font-size:14px;margin-top:8px">View your order</a>`;
  return { subject: `Order confirmed · ${args.orderNumber}`, html: shell("Order Confirmed 🎉", inner) };
}

export function abandonedCartEmail(args: {
  name: string;
  itemCount: number;
}): { subject: string; html: string } {
  const inner = `
    <p style="font-size:15px;line-height:1.6">You left ${args.itemCount} item${args.itemCount === 1 ? "" : "s"} in your cart. They're still waiting — finish checking out before they sell out.</p>
    <a href="${SITE}/cart" style="display:inline-block;background:#0b1624;color:#fff;padding:12px 20px;text-decoration:none;font-size:14px;margin-top:12px">Complete your order</a>`;
  return { subject: "Still thinking it over?", html: shell("Your commute kit is waiting", inner) };
}

export function abandonedCartText(name: string): string {
  return `Hi ${name.split(" ")[0]}, you left items in your ASAI.One cart. Finish your order here: ${SITE}/cart`;
}
