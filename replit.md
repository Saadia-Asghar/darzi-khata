# Darzi Khata — درزی کھاتہ

Offline-first bilingual Pakistani tailor-shop PWA. Business data and accounts
stay in browser localStorage; compressed fabric photos use IndexedDB. No cloud
sync, external database or bank integration in the approved offline-only upgrade.

## Product constraints

- Extend existing orders, measurements, receipts, team, customer history,
  earnings, backup/restore and dark mode; do not replace them.
- Provide English and Urdu, but show only the selected language at a time.
  Preserve the emerald/gold identity and 360px mobile layout.
- Keep the in-app language selector in More → Settings, not the phone header.
  English uses English day/instruction words, not Roman Urdu. Baqi is an
  intentional, consistently used domain term. Built-in fabric/demo text is
  translated for display; never rewrite users' custom descriptions or notes.
- The phone header has two single-line rows; keep its shop/owner text truncated
  at 320px. Overdue is a warning, never a replacement for the real order status.
- Onboarding dismissal belongs to each account, including demo, on both Skip
  and completion. Offline upgrades must preserve saved data and open drafts.
- Keep local email/password accounts. A separate OPTIONAL salted-hash PIN privacy
  lock can protect the local session, with five wrong tries locking for 30 seconds.
  It is not encryption or server authentication; never export account/PIN hashes.
- Payment QR is explicitly a DEMO placeholder, not bank-scannable.
- Credit score/loan estimate are illustrative, not a lending decision.
- Zindigi application action only creates a consented local printable profile.
  No customer names, phones or measurements enter that profile.
- Demo mode isolates financial sample data from original records. Never clear
  real storage while refreshing a demo. Team/accounts remain local browser data.
- The public landing page is `/`; application routes live under `/app`.
  Open app and Start free (including footer copies) must open the Login tab,
  even after a demo/session visit. Only Try demo shop may auto-open the demo.
  Do not erase saved accounts, orders or demo data to enforce this routing.
  Installed PWAs bypass the landing page. Demo counters must stay labelled
  as demo until genuine pilot aggregates exist.
- Shared lender/status links are seven-day self-signed snapshots, not
  bank-verified profiles or live feeds. Never imply that a signature verifies
  business identity, or that a demo QR can receive real bank payments.
- Pitch before/after scores must use the same credit model as the credit page.
  Never hard-code a separate score for the guided presentation.

## Run and validate

- Workflow: `artifacts/darzi-khata: web`
- Dev: `pnpm --filter @workspace/darzi-khata run dev`
- Typecheck: `pnpm --filter @workspace/darzi-khata typecheck`
- Tests: `pnpm --filter @workspace/darzi-khata test`
- Build: `PORT=24310 BASE_PATH=/ pnpm --filter @workspace/darzi-khata build`
- Build output: `artifacts/darzi-khata/dist/public`
- Managed workflows inject PORT/BASE_PATH; don't replace them.

## Stack and organization

Current workspace: React 19, Vite 7, TypeScript, Tailwind v4, Radix/shadcn,
React Hook Form/Zod, Wouter, Recharts, qrcode, vite-plugin-pwa.

App: `artifacts/darzi-khata`.
Core pure modules include payments, credit-score, voice-parse, garments, migrations,
order-validation and pin. Central storage adapter: `src/lib/storage.ts`; writes
notify all hook instances via local-store. Batch saves/restore roll back on quota failure.
Account context: `src/context/auth-context.tsx`.
Original order keys: `darzi-khata-orders-{ownerId}`.
Demo order keys: `darzi-khata-orders-financial-demo-{ownerId}`.
Settings/templates/karigars/serials also isolate demo namespaces.
Hook instances synchronize through local-store custom events and storage events.
Always preserve ledger totals when editing order advances.
Never fabricate deliveredAt for historical orders with no known delivery date.
Preserve legacy measurements on old orders. New items carry their own garment
type/measurements/price/quantity; total and suit count must equal the item sums.
Customer IDs, not phones, identify customers, order associations and history.
Distinct customers may share a phone; never automatically merge their profiles
or orders. Match valid normalized phones only when importing legacy records
that have no customer ID, and only when the match is unambiguous.
Real and demo customers,
photo IDs, settings and template registers must remain separate.
Backup/restore includes photos, customers, templates and manual karigars. Validate
all inputs before mutation and recompute the serial counter from restored DK IDs.

Production PWA precaches the app shell. Speech and WhatsApp require browser/network
services and must fail with a useful manual fallback. Static artifact production
configuration already exists; publishing remains a user action.

## Print and responsive constraints

- Receipt, work sheet and lender/credit profile must share the isolated iframe
  print path. Never print the live app page or a Radix dialog: the team observed
  overlays, settings and cut-off receipts in desktop Chrome print preview.
- PDF download uses the same isolated content and must work without a phone's
  print service. Wait for Urdu fonts and QR images before print/download.
- Preserve the phone layout below 768px. Settings tiles use 1/2/3 columns at
  phone/tablet/desktop widths. Desktop begins at 1024px, with sidebar on the
  logical start side (right in Urdu), desktop top bar and centred content.
- Desktop dialogs stay at most 560px wide; use three measurement fields per row
  where space permits. Do not hide overflowing content to disguise a broken layout.

README has demo credentials, full capabilities, storage details and limitations.
