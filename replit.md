# Darzi Khata — درزی کھاتہ

Pakistani tailor shop management web app. Offline-first, 100% localStorage, bilingual English + Urdu.

## Run & Operate

- `pnpm --filter @workspace/darzi-khata run dev` — start the web app (reads PORT env var)
- `cd artifacts/darzi-khata && npx tsc --noEmit` — typecheck
- `pnpm --filter @workspace/darzi-khata run build` — production build to `artifacts/darzi-khata/dist/public`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- React 18 + Vite 6 + Tailwind CSS v4
- Radix UI primitives, React Hook Form + Zod, Lucide React icons, Wouter router
- Fonts: Inter + Noto Nastaliq Urdu (Google Fonts)
- **No backend** — all data in localStorage

## Where things live

- `artifacts/darzi-khata/src/types/order.ts` — Order type (serialNumber, karigar, all fields)
- `artifacts/darzi-khata/src/hooks/use-orders.ts` — CRUD + 10 demo orders on first load
- `artifacts/darzi-khata/src/hooks/use-settings.ts` — ShopSettings (darkMode, pinEnabled, pin)
- `artifacts/darzi-khata/src/hooks/use-auth.ts` — PIN session via sessionStorage
- `artifacts/darzi-khata/src/hooks/use-karigars.ts` — Karigar list localStorage
- `artifacts/darzi-khata/src/hooks/use-templates.ts` — Measurement templates
- `artifacts/darzi-khata/src/pages/dashboard.tsx` — Main page (all modal state, filters)
- `artifacts/darzi-khata/src/App.tsx` — AuthGate wraps Router; shows LoginScreen if PIN enabled
- `artifacts/darzi-khata/src/index.css` — CSS vars for light + dark theme

## localStorage Keys

| Key | Contents |
|-----|----------|
| `darzi-khata-orders` | All orders JSON |
| `darzi-khata-settings` | Shop info, dark mode, PIN |
| `darzi-khata-templates` | Measurement templates |
| `darzi-khata-karigars` | Worker name list |
| `darzi-khata-serial-counter` | Last DK-XXX counter (starts at 10) |

## Architecture decisions

- **100% client-side**: No backend by design — works offline, installs as PWA
- **sessionStorage for auth**: PIN session clears when browser/tab closes — no logout required on device restart
- **Serial counter in localStorage**: Simple integer counter; getNextSerial() increments and pads to DK-001 format
- **Dark mode via CSS vars + `.dark` class on `<html>`**: Toggled by settings modal immediately, persisted in settings localStorage key
- **Demo data on first load**: 10 realistic orders injected only when `darzi-khata-orders` key is absent

## Product

Full tailor shop management: order CRUD with serial numbers, 11-point measurements, style specs, billing/baqi tracking, karigar assignment, digital receipt with WhatsApp sharing, PIN login, dark mode, customer directory, earnings chart, production work sheet, overdue section, due-today modal, backup/restore JSON.

## User preferences

- All UI labels bilingual: English + Roman/Nastaliq Urdu
- Theme: Emerald green (#047857) primary, gold (#d97706) accent, slate background
- Mobile-first layout, max-width 2xl centered

## Gotchas

- `PORT` and `BASE_PATH` env vars required by vite.config.ts — provided automatically by Replit workflows
- Clearing localStorage deletes all orders; use backup export first
- PWA manifest icons reference `/icon-192.png` and `/icon-512.png` (not yet generated — SVG favicon works for most browsers)
- Demo PIN: `1234` (user must enable PIN lock in Settings first, then set it manually)
