# Darzi Khata — درزی کھاتہ

Offline-first bilingual Pakistani tailor-shop PWA. All business data and accounts
stay in browser localStorage. No backend, database, cloud sync or bank integration.

## Product constraints

- Extend existing orders, measurements, receipts, team, customer history,
  earnings, backup/restore and dark mode; do not replace them.
- New labels English + Urdu; emerald/gold identity; 360px mobile layout.
- Local email/password accounts supersede retired PIN auth. Do not restore PIN.
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
Core pure modules: `src/lib/{payments,credit-score,voice-parse,reminders,demo-data}.ts`.
Account context: `src/context/auth-context.tsx`.
Original order keys: `darzi-khata-orders-{ownerId}`.
Demo order keys: `darzi-khata-orders-financial-demo-{ownerId}`.
Settings/templates/karigars/serials also isolate demo namespaces.
Hook instances synchronize through local-store custom events and storage events.
Always preserve ledger totals when editing order advances.
Never fabricate deliveredAt for historical orders with no known delivery date.

Production PWA precaches the app shell. Speech and WhatsApp require browser/network
services and must fail with a useful manual fallback. Static artifact production
configuration already exists; publishing remains a user action.

README has demo credentials, full capabilities, storage details and limitations.
