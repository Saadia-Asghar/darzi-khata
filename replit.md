# Darzi Khata — درزی کھاتہ

Offline-first bilingual Pakistani tailor-shop PWA. Business data and accounts
stay in browser localStorage; compressed fabric photos use IndexedDB. No cloud
sync, external database or bank integration in the approved offline-only upgrade.

## Product constraints

- Extend existing orders, measurements, receipts, team, customer history,
  earnings, backup/restore and dark mode; do not replace them.
- New labels English + Urdu; emerald/gold identity; 360px mobile layout.
- Keep local email/password accounts. A separate OPTIONAL salted-hash PIN privacy
  lock can protect the local session, with five wrong tries locking for 30 seconds.
  It is not encryption or server authentication; never export account/PIN hashes.
- Payment QR is explicitly a DEMO placeholder, not bank-scannable.
- Credit score/loan estimate are illustrative, not a lending decision.
- Zindigi application action only creates a consented local printable profile.
  No customer names, phones or measurements enter that profile.
- Demo mode isolates financial sample data from original records. Never clear
  real storage while refreshing a demo. Team/accounts remain local browser data.

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
Saved customers link old orders by normalized phone. Real and demo customers,
photo IDs, settings and template registers must remain separate.
Backup/restore includes photos, customers, templates and manual karigars. Validate
all inputs before mutation and recompute the serial counter from restored DK IDs.

Production PWA precaches the app shell. Speech and WhatsApp require browser/network
services and must fail with a useful manual fallback. Static artifact production
configuration already exists; publishing remains a user action.

README has demo credentials, full capabilities, storage details and limitations.
