@AGENTS.md


This project is a workshop room rental site based in Sofia, Bulgaria (EU).
Stack: Next.js (React, no TypeScript), plain CSS, Supabase (PostgreSQL), Stripe, Resend.

Hosting: Netlify or Cloudflare Pages (free tier, commercial use allowed). Supabase free tier for now, Stripe per-transaction only.
Design: Cosy & industrial vibe. Single room for now but build for easy expansion later.

Booking flow: User browses room → picks date/time on calendar → availability checked against Supabase → redirected to Stripe Checkout (card only, upfront) → webhook confirms payment → booking saved to Supabase → confirmation email via Resend.

Customer verification: Low friction. Billing address + card on file + AVS check. No government ID required. Phone verification optional later.
Security (mandatory before launch): Supabase Row Level Security enabled, Stripe webhook signature verification, environment variables for all secrets (never expose on frontend), Cloudflare in front of domain, security headers in Next.js.

Security (post-launch): Rate limiting via Upstash, Cloudflare Turnstile on booking form, Stripe Radar custom rules.

EU compliance: GDPR cookie consent (Cookiebot free tier), privacy policy page, terms of service checkbox before checkout. Stripe handles SCA/PSD2 automatically. Consider Stripe Tax for VAT.

Supabase tables: rooms, bookings, availability.

The user is a beginner. Explain concepts simply. Avoid jargon without explanation. When writing code, add brief comments explaining what each part does.