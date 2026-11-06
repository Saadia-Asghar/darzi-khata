# Darzi Khata — درزی کھاتہ

An offline-first, bilingual Pakistani tailor-shop khata with order management,
payment records and an illustrative business credit profile. Built for the
financial-inclusion pitch at GIKI × Zindigi Prize.

## Live demo

**Published URL:** https://mobile-first-web-u2024550.replit.app

This is the verified existing deployment URL. Workspace changes require
**Publish / Republish** before appearing at that URL.

On the login screen, expand **Demo Accounts**. All four accounts use `demo1234`:

| Role | Email |
|---|---|
| Shop owner | `demo@darzikhata.com` |
| Ustad Bashir | `bashir@darzikhata.com` |
| Ahmed Karigar | `ahmed@darzikhata.com` |
| Rustam Ustad | `rustam@darzikhata.com` |

The owner demo starts with **150 synthetic orders over six calendar months**,
growing revenue, cash/wallet/Raast/bank records, delivered and unfinished work,
assigned karigars, and example order conversations. These are synthetic records,
not customers or verified financial transactions. Do not send messages to demo numbers.

## New financial-inclusion features

- **Payment details:** account title, Zindigi wallet and Raast ID/IBAN in Settings,
  shown on the parchi and included in WhatsApp receipt/reminder text.
- **Demo QR:** generated locally with `qrcode`, encoding shop, account, PKR
  balance and order reference. **Not a bank-compatible Raast/EMV merchant QR.**
  The payload builder is isolated in `src/lib/payments.ts` for a future authorized
  merchant API integration. Banking apps cannot process this placeholder.
- **Payment ledger:** incremental amount, cash/Zindigi/Raast/bank method and date.
  Existing advances migrate once into cash entries. Simulated Zindigi settlement
  is restricted to the isolated demo dataset; it never contacts a bank.
- **Digital vs cash:** this month's amount-weighted digital share on the dashboard,
  plus six-month payment-date charts and tables in Impact.
- **Darzi Credit Score:** an explainable, local, 0–100 illustration. Factors:
  business age (15%), order volume/consistency (20%), revenue trend (20%),
  observed on-time delivery (20%), collections (15%), digital payments (10%).
  Starter <40, Growing 40–69, Trusted ≥70.
- **Indicative loan estimate:** 1.5 × average monthly billed revenue × score/100,
  capped at PKR 300,000. Requires at least five orders over two calendar months.
  **Not a loan offer, lender decision, or credit-bureau rating.**
- **Consent-first business profile:** “Apply via Zindigi” creates a local printable
  A4 summary only after consent. It sends nothing. Includes shop name/type,
  months active, revenue series, order count, delivery/collection percentages
  and score. No customer names, phone numbers or measurements.
- **WhatsApp reminders:** ready for collection, balance and tomorrow's delivery;
  pending list for ready orders >3 days and delivered orders with unpaid balances.
  Pakistani numbers normalized to `923...`. Opens a draft, never sends automatically.
  `wa.me` is text-only; QR images are on the receipt, not attached automatically.
- **Voice measurements:** Web Speech API, Urdu (`ur-PK`) with an English language
  fallback. Parses Urdu/Roman Urdu numbers 1–60, English and half inches. Transcript
  and proposed measurements are shown before Apply. Hidden when unsupported.
  Recognition depends on the browser and usually needs internet.
- **Impact:** recorded orders/revenue, collections, digital share, customers,
  karigars and observed on-time deliveries.
- **Business types:** shop, home-based and women home-tailor.
- **First-run intro:** three bilingual slides, record → payments → credit record.

## Existing shop features preserved

- Create, edit and delete orders; per-shop DK serials; urgent flag; suit count;
  delivery dates; pending → stitching → ready → delivered.
- Eleven kameez/shalwar measurements, half-inch steppers, saved templates,
  style details and customer-history measurement copying.
- Shop-owner and karigar views, assignment, per-order conversations, team
  management and shareable invitation instructions.
- Customer directory/history, filters, overdue and due-today views, earnings,
  printable worksheets, parchi/WhatsApp receipt, dark mode, JSON backup/restore.
- Local email/password accounts replaced the old PIN screen; no PIN lock is restored.

## Offline and data safety

**No backend or cloud sync.** All accounts and data live in this browser's
`localStorage`; the session uses `sessionStorage`. Accounts are a local access
convenience, not secure server-enforced authentication. Hashing alone does not
make localStorage accounts production-grade identity management.

Owner and karigar accounts can demonstrate shared tasks on the **same browser**.
Invitations do not create cross-device team sync. Clearing browser storage loses
the khata: export a backup regularly. Publishing does not upload local records.

Demo mode isolates orders, serials, payment settings, templates and karigar lists
in separate keys; switching off returns to original records. Clear Demo removes
only that demonstration area. Team account membership itself remains local to
the shared accounts list.

| Key family | Purpose |
|---|---|
| `darzi-khata-accounts` | Local user accounts |
| `darzi-khata-orders-{ownerId}` | Original shop orders |
| `darzi-khata-settings-{ownerId}` | Original shop settings |
| `darzi-khata-templates-{ownerId}` | Measurement templates |
| `darzi-khata-karigars-{ownerId}` | Karigar name list |
| `darzi-khata-serial-{ownerId}` | Original serial counter |
| `darzi-khata-demo-mode-{ownerId}` | Active data-area selection |
| `darzi-khata-*-financial-demo-{ownerId}` | Isolated demonstration records |

Old unscoped keys are preserved. The first non-demo shop claims a copy of the
pre-account orders/settings/templates/karigars/counter once; originals remain
available for recovery. Old order advances become cash ledger entries without
changing the collected total. Legacy delivered orders without `deliveredAt`
are excluded from the observed on-time denominator rather than assumed on-time.

Revenue means **billed order value**, collections mean amounts recorded received.
Digital share is amount-weighted from payment records. The score uses at most
the latest six calendar months for volume/revenue trends; age uses the first
recorded order. All results are self-reported and illustrative.

## PWA

Production builds generate a manifest, real 192/512px icons and a Workbox
service worker. The app shell, JS, CSS and icons are precached. Install through
your browser's Install/Add to Home Screen after one successful online visit.
App data entry works offline; WhatsApp and browser-hosted speech recognition
do not. Fonts cached after loading have system-font fallbacks.
The service worker is disabled during Vite development.

## Develop and verify

Requires Node 24 and pnpm. The current workspace catalogs React 19 and Vite 7;
no framework downgrade was made to match the older brief.

```bash
pnpm install
# Replit's existing artifact workflow supplies PORT and BASE_PATH:
pnpm --filter @workspace/darzi-khata run dev
# Outside managed workflows:
PORT=24310 BASE_PATH=/ pnpm --filter @workspace/darzi-khata run dev

pnpm --filter @workspace/darzi-khata test
pnpm --filter @workspace/darzi-khata typecheck
PORT=24310 BASE_PATH=/ pnpm --filter @workspace/darzi-khata build
```

The tests cover migration, incremental/invalid payments, QR disclaimers,
payment-date digital share, score/empty/legacy-delivery cases, phone/reminder
logic, all canonical Urdu/Roman Urdu numbers 1–60 and voice parsing.

## Publishing

The existing artifact already serves a static Vite build from
`artifacts/darzi-khata/dist/public`, with SPA rewrites. The monorepo also contains
an unused API artifact; the khata does not call it. Keep managed artifact routing.
Use Replit's Publish/Republish action to release these workspace changes.

## Main implementation files

- `src/lib/payments.ts`: ledger migration, validation, demo QR builder and shares.
- `src/lib/credit-score.ts`: pure scoring and business summary functions.
- `src/lib/voice-parse.ts`: pure speech-to-measurements parser.
- `src/lib/reminders.ts`: bilingual templates and phone normalization.
- `src/lib/demo-data.ts`: deterministic six-month synthetic dataset.
- `src/hooks/use-demo-mode.ts`: data-area switching and demo-only clearing.
- `src/lib/local-store.ts`: cross-component/tab updates and legacy data claim.
- `src/components/credit-modal.tsx`: consent and printable A4 profile.
- `vite.config.ts`: production PWA precaching.

## Screenshot placeholders

- [ ] Dashboard: current-month payment mix and demo badge
- [ ] Parchi: demo QR and account details
- [ ] Credit: six factors and indicative estimate
- [ ] A4 business profile
- [ ] Impact: six-month cash/digital chart
- [ ] Voice transcript preview on Chrome Android
