# ASAI.One — branded Supabase auth email templates

On-brand HTML for the transactional emails Supabase Auth sends. Paste each file's
contents into **Supabase dashboard → Authentication → Emails**, into the matching
template, and set the **Subject** line shown below.

| Dashboard template      | File                   | Subject |
|-------------------------|------------------------|---------|
| Confirm signup          | `confirm-signup.html`  | `Confirm your ASAI.One account` |
| Reset password          | `reset-password.html`  | `Reset your ASAI.One password` |
| Change email address    | `change-email.html`    | `Confirm your new email · ASAI.One` |
| Magic Link              | `magic-link.html`      | `Your ASAI.One sign-in link` |
| Reauthentication        | `reauthentication.html`| `Your ASAI.One verification code` |

> Invite-user isn't used by the storefront; if you enable it, copy `magic-link.html`
> and change the heading/CTA copy.

## Design notes

- **Palette** mirrors `app/globals.css`: navy-800 `#0b1624` (CTA + headlines),
  navy-500 `#1e4080`, page ground `#f8f7f4`, hairline `rgba(10,10,10,0.12)`,
  error `#c0392b`. Square corners and hairline borders, like the app UI.
- **Fonts**: the templates request Bebas Neue / Barlow Condensed / Barlow / DM Mono
  via a Google Fonts `@import`. Clients that strip web fonts (Gmail, Outlook) fall
  back to `Arial Narrow` / `Arial`, which keeps the condensed feel. No layout
  depends on the web font loading.
- **Buttons** are table + `bgcolor` based (not CSS `background`), so they render in
  Outlook. Every CTA also has a plain-text fallback URL beneath it.

## Supabase template variables used

These templates use the **server-side (`token_hash`) flow**, not `{{ .ConfirmationURL }}`.
Each action link points directly at the app's own `/auth/confirm` route handler,
which calls `verifyOtp({ type, token_hash })`, establishes the session, then
redirects to the page named in `next`:

- `{{ .SiteURL }}` — the configured Site URL (the link host + footer links).
- `{{ .TokenHash }}` — the hashed one-time token, verified server-side.
- `{{ .Token }}` — the 6-digit code (reauthentication only).

Per template, the link is:

| Template        | `type`         | `next`                      |
|-----------------|----------------|-----------------------------|
| Confirm signup  | `signup`       | `/account`                  |
| Reset password  | `recovery`     | `/account/update-password`  |
| Change email    | `email_change` | `/account`                  |
| Magic Link      | `magiclink`    | `/account`                  |

> **Why not `{{ .ConfirmationURL }}`?** That default routes recovery through the
> implicit flow, which drops the user at the Site URL with the token in the URL
> *hash* — the browser client silently signs them in and they never reach the
> set-new-password page. The `token_hash` link avoids this by letting the server
> verify and route deliberately.

## Reminder

- **Authentication → URL Configuration → Site URL** must be your real app origin
  (`http://localhost:3000` in dev, your domain in prod) — the links are built from
  `{{ .SiteURL }}`.
- The redirect-allowlist step is **no longer required** for these templates: the
  links point straight at `<SITE_URL>/auth/confirm`, not a `redirect_to` target.
  (`/auth/confirm` already accepts a PKCE `code` too, so the old allowlisted flow
  still works as a fallback if you keep `redirectTo` in `requestPasswordReset`.)
