# Edit account details — design

**Date:** 2026-06-26
**Status:** Approved scope, pending spec review

## Goal

Let a signed-in user update their own details from the account page (`/account`):
name, communication preferences, default delivery address, email, and phone.
Editing happens **inline** on the account page — no separate route.

## Scope

Editable fields:

| Field | Storage | Verification |
| --- | --- | --- |
| Name (`full_name`) | `profiles` | none |
| Marketing opt-in | `profiles.marketing_opt_in` | none |
| WhatsApp opt-in | `profiles.whatsapp_opt_in` | none |
| Default address | `addresses` (`is_default = true`) | none |
| Email | auth identity | Supabase confirmation email (out-of-band) |
| Phone | auth identity | Supabase SMS OTP (in-UI, two-step) |

Out of scope: password change, multiple/non-default addresses, deleting the
account.

## Architecture

The account page (`app/account/page.tsx`) stays a **server component** that
fetches `profile` (via `getProfile`) and the default `address`. The read-only
"Account details" panel is replaced by a **client island** that receives this
data as props and manages inline read↔edit state.

### Components (`components/account/`)

- **`account-details.tsx`** — client island. Renders the detail rows
  (Name, Email, Phone, communication prefs) with per-section "Edit" toggles.
  - **Profile sub-form**: Name + two opt-in checkboxes → `updateProfile`.
  - **Email sub-form**: new email → `requestEmailChange`; on success collapses
    to a "Check your inbox to confirm" note. Displayed email stays the current
    (confirmed) one until Supabase syncs it.
  - **Phone sub-form**: new phone → `requestPhoneChange`; on success swaps to a
    6-digit OTP step (same UI idiom as `register-form.tsx`) →
    `confirmPhoneChange`. On verify, the displayed phone updates.
- **`address-editor.tsx`** — client island for the default address. Read view
  mirrors the current single-line summary; edit view is the checkout shipping
  field set (Full name, Phone, Address line 1, line 2, City, State `Select`,
  PIN) → `updateDefaultAddress`.

Both reuse existing primitives: `LabeledInput`, `Field`, `Select`, `Button`,
and `toast` for success/error. Validation mirrors the checkout/register forms
(client-side for UX; authoritative re-validation server-side).

### Server actions (`lib/account/actions.ts`, `"use server"`)

Mirror `lib/auth/actions.ts` conventions: server-side validation, generic
error messages (never echo raw Supabase auth errors), rate-limiting via
`withinRateLimit`, `revalidatePath("/account")` on mutation.

- `updateProfile({ fullName, marketingOptIn, whatsappOptIn }): AuthResult`
  — user-scoped `createClient()` update on `profiles` (RLS owns the row, same
  as the signup action). Trims/length-caps name.
- `updateDefaultAddress(input): AuthResult` — upsert the user's
  `is_default` address row (user-scoped; RLS `auth.uid() = user_id`).
  Reuses the field validation shape from `order-actions.validateContact`.
  Normalises phone to E.164 like `order-actions.toE164`.
- `requestEmailChange(email): AuthResult` — validate email, then
  `auth.updateUser({ email })`. Returns a "confirm via the link we emailed"
  message. **Graceful fallback:** if Supabase returns a config/SMTP error,
  return a generic "Email change is temporarily unavailable" message.
- `requestPhoneChange(phone): AuthResult & { phone?: string }` — validate +
  normalise to E.164, rate-limit (3/number/hr + per-IP cap, same as
  `sendPhoneOtp`), then `auth.updateUser({ phone })`. **Graceful fallback:** an
  SMS-provider/config error returns "Phone verification is temporarily
  unavailable" rather than surfacing the raw error.
- `confirmPhoneChange(phone, token): AuthResult` —
  `auth.verifyOtp({ phone, token, type: "phone_change" })`; on success also
  update `profiles.phone` to keep the display copy in sync, then
  `revalidatePath("/account")`.

## Data-sync notes

- **Phone**: after OTP verify, `profiles.phone` is updated in the same action,
  so the account page reflects it immediately.
- **Email**: confirmation is out-of-band (user clicks the emailed link later),
  so the action cannot sync `profiles.email`. The page keeps showing the
  current confirmed email plus a transient "pending confirmation" note; the
  copy reconciles on the next login / via any existing auth→profiles trigger.
  We do **not** optimistically show the unconfirmed email.

## Error handling

- All actions return the existing `AuthResult` (`{ ok, message }`) shape;
  clients show `toast(...)`. Field-level errors render inline like the other
  forms.
- Auth-identity actions fail **closed** with a generic message when the
  provider is misconfigured — no raw error leaks, no false "success".

## Testing

- Manual: edit name + prefs, save, confirm persistence on reload.
- Manual: edit default address (insert when none exists, update when one does).
- Manual: email change shows the inbox-confirmation note.
- Manual: phone change → OTP step → verify path (requires working SMS; with SMS
  unconfigured, confirm the graceful "unavailable" message appears).
- Lint: `pnpm lint` clean — in particular no `react-hooks/set-state-in-effect`
  (this repo treats it as an error).
