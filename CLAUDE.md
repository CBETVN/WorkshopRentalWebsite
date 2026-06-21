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
