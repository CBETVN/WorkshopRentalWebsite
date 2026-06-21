@AGENTS.md

# Workshop Rental Website

A workshop room rental site based in Sofia, Bulgaria (EU).

## Tech Stack

- **Framework:** Next.js (React, no TypeScript)
- **Styling:** Plain CSS (no Tailwind)
- **Database:** Supabase (PostgreSQL)
- **Payments:** Stripe
- **Email:** Resend (to decide later)

## Hosting & Infrastructure

- **Hosting:** Netlify or Cloudflare Pages (free tier, commercial use allowed)
- **Database:** Supabase free tier for now
- **Payments:** Stripe, per-transaction only

## Design

Cosy & industrial vibe. Single room for now, but built for easy multi-room
expansion later.

## Booking Flow

1. User browses room
2. Picks date/time on calendar
3. Availability checked against Supabase
4. Redirected to Stripe Checkout (card only, upfront)
5. Stripe webhook confirms payment
6. Booking saved to Supabase
7. Confirmation email sent via Resend

## Stripe Implementation Notes

> **Source:** adapted from a video tutorial ("How To Accept Payments With
> Stripe", Web Dev Simplified). The video uses Express + vanilla JS; the points
> below are translated to our Next.js stack. **Pending confirmation** against the
> official Stripe + Next.js App Router docs before we build.

> **Rewrite before going live**

```const PRICE_PER_HOUR = 10;  // in src/app/booking/page.js — client-side!```

That hardcoded price is fine for display, but when we build real checkout, the price must be re-fetched from Supabase on the server before charging. The browser can lie; the rooms table can't.

- **Checkout flow:** browser → our `api/checkout/route.js` → server creates a
  Stripe Checkout session → returns its URL → browser redirects to Stripe.
- **Never trust prices from the browser.** The client sends only *what* and *how
  many* (room/slot IDs + quantity). The price is always re-read **server-side**
  from the `rooms` table before charging. (The `PRICE_PER_HOUR` in the booking
  page is for display only.)
- **Prices are in cents** (smallest unit): €10 → `1000`. Two hours at €10 →
  `unit_amount: 1000, quantity: 2`.
- **Mode is `payment`** (one-time), not `subscription`.
- **Secret key is server-only**, loaded from `.env.local` (Next.js loads it
  automatically — no `dotenv` needed) and never committed.
- **Use test keys + test card `4242 4242 4242 4242`** (any future expiry, any
  CVC) during development.
- **Confirm payment via webhook, NOT the success redirect.** Landing on the
  success page is just a friendly "thanks" screen — a user could close the tab or
  visit the URL manually. The real booking save + confirmation email happen in
  `api/webhooks/stripe/route.js` when Stripe notifies our server the payment
  truly succeeded. (The video skips webhooks — this is our addition.)
- **No Express, no CORS, no `dotenv`, no static `public` server** from the video
  are needed — Next.js provides all of that. Only `api/checkout/route.js` plus a
  button.

## Project Structure

```
src/app/                          Pages and API routes (App Router, folder = URL)
src/app/api/                      Server-side routes:
  availability/route.js             Check open slots
  checkout/route.js                 Create Stripe session
  webhooks/stripe/route.js          Handle Stripe payment confirmation
src/app/room/[id]/                Dynamic room page (one folder serves every room)
src/components/                   Reusable UI pieces, each in its own folder with
                                  a paired CSS file:
                                    Header, Footer, RoomCard, BookingCalendar,
                                    BookingSummary, CookieConsent, TermsCheckbox
src/lib/                          Shared server-side logic (the "brains").
                                  Never exposed to the browser:
                                    supabase.js, stripe.js, resend.js, bookings.js,
                                    availability.js, email-templates.js
src/styles/variables.css         CSS custom properties for global theming
supabase/migrations/             SQL files that define database tables
public/images/                   Static assets
```

## Architecture Decisions

- **All API files must be named `route.js`** (a Next.js requirement). The folder
  path is what makes each route unique.
- **`src/lib/` runs server-side only** — invisible in browser dev tools. Components
  are client-side and visible, so secrets never go there.
- **Dynamic route `room/[id]/`** means adding rooms later needs zero code changes —
  just a new database row.
- **Privacy policy and terms of service need their own pages** (GDPR requirement;
  Stripe may also ask for the links).

## Customer Verification

Low friction:

- Billing address + card on file + AVS check
- No government ID required
- Phone verification optional later

## Database

Supabase tables: `rooms`, `bookings`, `availability` (plus `blocklist` and
`coupons` when those features land).

> Note: `rooms` is really the *first product type*. See **Data Model &
> Extensibility** below for the generalized `products` shape we'll grow into.

## Data Model & Extensibility

**Goal:** sell more than just hourly room time later (workshops, physical items
like blank 3D models, digital downloads) by **adding** code, never rewriting it.
We design the extension points ("seams") now and implement only the room today.

A **seam** = a spot in the code designed for plugging in new behavior without
editing the existing code around it.

### One table: `products` (not `rooms`)

The room is just the first product, of type `room_hourly`. Adding a new thing to
sell later = inserting a row, not changing the schema.

```
products
  id
  type         "room_hourly" | "workshop" | "physical" | "digital"
  name
  description
  price_cents  ← price lives HERE (server-side), never in a page component
  active
  metadata     (jsonb) ← type-specific extras: { capacity }, { stock }, { file_url }
```

The `metadata` jsonb column holds type-specific fields, so new product types
don't each need a schema migration.

### The seam: a type-handler registry

Each product *type* gets a small module that answers two questions:
1. **"Can it be bought right now?"** (availability for time-based, stock for items)
2. **"What happens after payment?"** (fulfillment — called from the webhook)

They're collected in one lookup. This lookup IS the seam:

```js
// src/lib/productTypes/index.js — the registry (the seam)
import roomHourly from "./roomHourly";

const handlers = {
  room_hourly: roomHourly,
  // workshop: ...   ← added later, nothing else changes
  // physical: ...
};

export function getHandler(type) {
  return handlers[type];
}
```

```js
// src/lib/productTypes/roomHourly.js — everything specific to a room
export default {
  async checkAvailability(product, selection) { /* calendar/slot check */ },
  async fulfill(product, order) { /* create a booking row */ },
};
```

Today the registry has one entry. Adding workshops = write `workshop.js`, add one
line. No existing code is rewritten.

### The generic pipeline (written once, reused by every type)

Everything except those two questions is type-agnostic from day one, because it
is no harder to write generically than hardcoded. Stripe is the unifier: every
product becomes a line item of `{ name, price_cents, quantity }`.

```
cart (any products)
  → src/lib/pricing.js      totals + coupons          (generic)
  → api/checkout/route.js   build Stripe line items   (generic)
  → Stripe Checkout
  → api/webhooks/stripe/route.js   payment confirmed
       → getHandler(product.type).fulfill(...)   ← dispatch at the seam
```

The cart, pricing, checkout, and webhook never name a specific product type —
they pass `product.type` to the registry at the only two moments it matters.

### Rule: build the seams now, implement the types later

- **Generalize now (≈free):** name the table `products` with a `type` column;
  keep `price_cents` on the product; write cart/pricing/checkout/webhook
  generically; route availability + fulfillment through `getHandler(type)`.
- **Defer:** the actual workshop/inventory/download logic. Only `room_hourly` is
  implemented for now.
- **Don't** scatter the word "room" deep into the code — think "product".

This keeps "add a new thing to sell" a matter of **one new handler file + one
registry line**, not a rewrite.

## Features

### Big language button (with flags) with two options BG and ENG








### Date Blocking (owner blocks / "fake" bookings)

- Owner can block dates so they appear unavailable to customers.
- Implemented with a `type` column on the `bookings` table: `customer` vs
  `owner_block`. The availability check treats both the same.
- Managed via a password-protected admin page at `/admin`, usable from any device
  including mobile.
- Also editable directly in the Supabase Dashboard (table editor, like a
  spreadsheet).

### Blocklist (planned)

- Separate `blocklist` table in Supabase with `email` and Stripe card
  `fingerprint` columns.
- Logic in `src/lib/blocklist.js`, checked in `checkout/route.js` before creating
  a Stripe session.
- Blocked users see a generic "booking unavailable" message — never told they're
  blocked.
- Managed via the admin page or directly in the Supabase Dashboard.

### Coupon System (planned)

- Types to support: percentage off, fixed amount off, one-time use, limited use,
  unlimited/persistent, per-customer limit, time-limited, minimum booking value.
- `coupons` table with columns for code, discount type, value, max uses, current
  uses, start/end dates, active flag.
- Discount is **always calculated server-side**, never on the frontend.
- Stripe has a built-in coupon system that's simpler to start with; a custom
  system can replace it later.

## Race Condition Handling

- Two users browsing the calendar at once is just UI — no database impact.
- Conflicts are resolved at the **database level** with a unique constraint on
  `room + date + time`. First insert wins, the second fails. Handled in
  `src/lib/availability.js`.

## Security

### Mandatory before launch

- Supabase Row Level Security enabled
- Stripe webhook signature verification
- Environment variables for all secrets (never expose on frontend)
- Cloudflare in front of domain
- Security headers in Next.js

### Post-launch

- Rate limiting via Upstash
- Cloudflare Turnstile on booking form
- Stripe Radar custom rules

## Known Risks / Hardening

Things to get right as each part is built (ranked by how badly they can hurt:
leaked data, lost money, or loss of control). Most of these are not yet built —
this is a checklist for when they are.

### Tier 1 — data leak, money loss, or takeover

- **RLS must be correct from the first day a table exists, not "before launch".**
  The browser talks to Supabase with a public key; if Row Level Security is off
  or wrong, anyone can read every customer's PII (`bookings` holds emails/names)
  via dev tools. Enable + test RLS the moment a table is created.
- **`/admin` needs real server-side auth.** It can block dates and edit the
  blocklist and is reachable from the public internet. A single shared password
  (especially checked client-side) is not enough — use Supabase Auth or a
  server-verified session, plus rate limiting on the login.
- **"Paid but slot taken" must have an answer.** Bookings are only saved on the
  webhook (after payment), so two users can both pay for the same slot. Either
  reserve the slot at checkout creation (a "pending" hold) or auto-refund the
  loser when the unique-constraint insert fails. Never leave a customer charged
  with no booking. See [Race Condition Handling](#race-condition-handling).
- **Don't trust ANY value from the browser**, not just price: re-check slot
  availability, hours, room ID, and coupon codes server-side before charging.

### Tier 2 — real bugs / double charges

- **Webhook idempotency:** Stripe delivers the same event more than once. Store
  the event ID and skip duplicates, or you'll double-book and double-email.
- **Webhook raw body:** signature verification needs the raw request body — a
  known Next.js App Router gotcha. Confirm signatures actually verify.
- **Webhook failure recovery:** if the booking saves but the email fails, the
  customer paid and got no confirmation. Decide the source of truth + reconcile.
- **Time zones:** dates are currently computed with `new Date()` in the browser.
  Pin availability and bookings to `Europe/Sofia` on the server to avoid
  off-by-one-day bookings.
- **`NEXT_PUBLIC_` footgun:** any env var with that prefix ships to the browser.
  Keep Stripe secret + Supabase `service_role` keys unprefixed and server-only.

### Tier 3 — lower urgency

- **Anti-abuse deferred too far:** at least rate-limit the admin login and
  checkout before launch (Stripe session spam, Resend cost/reputation, brute
  force).
- **Blocklist is inherently weak:** email blocks are bypassed with a new email;
  storing card fingerprints is personal data needing privacy-policy disclosure
  and conflicts with "right to be forgotten". Deters, does not stop, abuse.
- **Dependency audit:** review `npm audit` findings before launch.

## Security Risks (Threat Model)

How a solo site like this actually gets taken over — ranked worst-first. The key
insight: the danger is rarely a clever code exploit. It is almost always a
**leaked secret** or a **compromised account password**. So the highest-value
security work is operational discipline, not code.

### Tier 1 — how small sites really get owned

- **Leaked secret key (#1 risk).** The Supabase `service_role` key bypasses all
  RLS (full database control); the Stripe secret key can read customer data and
  move money. Leaks happen by committing `.env` (bots scan public repos in
  seconds), prefixing a secret with `NEXT_PUBLIC_` (ships it to the browser), or
  pasting it into a screenshot/chat. Defense: `.env.local` only (already
  gitignored), never `NEXT_PUBLIC_` on a secret, **rotate immediately if leaked**.
- **Account takeover (not code).** GitHub, Supabase, Stripe, Cloudflare, the
  domain registrar, and especially **email** (it can reset everything else). A
  stolen/weak password here owns the whole project. Defense: **2FA on every
  account** (authenticator app preferred over SMS) + unique passwords via a
  password manager. Save each service's backup/recovery codes off-phone. This is
  the single highest-value security task and it is not code.
- **Supabase RLS off or wrong.** The browser uses a public key by design; RLS is
  the only thing stopping a stranger from reading every customer's PII with it.
  Defense: RLS on from the first day a table exists, and test it as an anonymous
  user. (See also [Known Risks / Hardening](#known-risks--hardening).)

### Tier 2 — app-level attacks

- **Weak `/admin` auth** → attacker blocks dates, deletes bookings, reads PII.
  Defense: server-side auth (Supabase magic-link), email allowlist, login rate
  limiting. Never check a password in client-side code.
- **Trusting the browser** → forged `€0` prices, faked success redirect, spoofed
  webhook. Defense: re-check everything server-side; confirm payment via the
  **signed webhook**, not the redirect.
- **XSS (injected JavaScript)** → steals your admin session. React escapes text
  by default (mostly safe); the risk is `dangerouslySetInnerHTML` with user data.
  Defense: avoid it; add a Content-Security-Policy header.

### Tier 3 — lower likelihood

- **Malicious dependency** (or a typo'd package name on install). Defense: review
  `npm audit`, verify package names, enable Dependabot.
- **Phishing you** with a fake login link. Defense: 2FA stops a stolen password; a
  password manager won't autofill on a fake domain (a useful warning sign).

### Pre-launch security checklist

- [ ] 2FA enabled on email, GitHub, Supabase, Stripe, Cloudflare, domain registrar
- [ ] Backup/recovery codes saved off-phone
- [ ] No secret ever prefixed `NEXT_PUBLIC_`; `service_role` key server-only
- [ ] RLS enabled + tested as anonymous on every table
- [ ] `/admin` behind real server-side auth + rate-limited login
- [ ] Stripe webhook signature verification working
- [ ] `npm audit` reviewed

## EU Compliance

- GDPR cookie consent (Cookiebot free tier)
- Privacy policy page
- Terms of service checkbox before checkout
- Stripe handles SCA/PSD2 automatically
- Consider Stripe Tax for VAT

## Testing Approach

- **Unit tests first (Jest)** for `src/lib/` logic — availability, coupons,
  pricing.
- **End-to-end tests second (Playwright)** for the critical booking path.
- Skip integration tests for now.
- **GitHub Actions** for CI (runs tests on every push, free).

## React Hooks in Use

- **`useState`** — selected dates, form inputs, coupon codes.
- **`useEffect`** — fetching data on load or when a value changes (e.g. fetching
  slots when a date is picked).
- **`useRef`** — rarely; input focus or non-rendering values.

## Day-to-Day Workflow

- **VS Code** for writing code.
- **Supabase Dashboard** (browser) for viewing/editing database data.
- **Admin page** on the site for quick daily tasks (blocking dates, managing the
  blocklist).
- **Stripe Dashboard** for payments and revenue.
- **Resend Dashboard** for email delivery status.

## Planned Future Features

- Coupon/discount code system
- User blocklist (by email and Stripe card fingerprint)
- Optional phone verification
- Cancellation/refund logic with a configurable time window
- Multi-room expansion

Keep code modular to support these later.

## Working With This Project

The user is a beginner with basic level of js and react understanding. Explain concepts simply.
Avoid jargon without explanation.
Follow best practices and programming principles,
always comment code you wrote.
Give variables a descriptive names(e.g. "rooms" instead of "r").
When writing code, add brief comments explaining what each part
does.
