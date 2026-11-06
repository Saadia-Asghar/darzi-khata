# Darzi Khata verification

Verified on 6 November 2026. This is an evidence report, not a claim that every
acceptance criterion is complete.

## Results

Stale-preview recovery follow-up: reproduced an older offline worker serving
the bilingual sign-in screen, then verified it upgrades to the current
single-language sign-up screen. The test checks both English and Urdu and
preservation of localStorage and IndexedDB markers. The recovery worker is
served only by Vite development; production PWA behavior is unchanged.

### Optional encrypted backup verification

Verified on 6 November 2026 against the production preview build:

- `pnpm --filter @workspace/darzi-khata test`: 29 finance tests and 48 Vitest
  tests passed, including 9 new encrypted-backup tests. The expanded customer
  profile round-trip fixture was then checked with the focused encryption suite:
  all 9 tests passed.
- `pnpm --filter @workspace/darzi-khata typecheck`: passed.
- `PORT=24310 BASE_PATH=/ pnpm --filter @workspace/darzi-khata build`: passed;
  existing sourcemap and large-chunk warnings remain.
- Focused mobile Playwright backup checks: the original plain JSON export/
  restore test passed. The encrypted journey initially exposed a test-fixture
  timing issue: startup migration added customer IDs, garment items and payment
  arrays after the baseline snapshot. The test now waits for that migration.
  `E2E_BASE_URL=https://$REPLIT_DEV_DOMAIN pnpm exec playwright test --grep
  'encrypted backup rejects'` then passed.
- Browser checks cover mismatched confirmation, encrypted download without
  customer plaintext, wrong passphrase, damaged authentication tag, unchanged
  current data on failure/cancel, explicit replacement confirmation, successful
  restore and reload, serial repair, passphrase clearing and absence from
  browser storage. Plain JSON compatibility remains covered.
- Signed-in browser inspection at 360×844 in dark Urdu RTL showed the encrypted
  backup panel and its controls without horizontal overflow.
- Unit round trips include customers and saved measurement profiles, payment
  records, photos, templates, team and settings. They also check random salts/
  IVs, altered metadata, unsupported formats, unavailable Web Crypto, recursive
  password/PIN filtering, and legacy JSON restoration.
- No cloud storage or new authentication was introduced. Physical Android/
  iPhone cross-device file transfer has not been verified.

Language/clutter follow-up: added a visible English/Urdu switch to the main
header, routed tool headers and sign-in. UI labels now show one language at a
time. Help on More is collapsed by default. TypeScript, all 68 unit tests,
the language-switch/persistence browser scenario and the 360px dark-Urdu page
layout scenario pass. English and Urdu mobile screenshots were inspected.
Impeccable source scan has no findings. Older Lighthouse measurements below
predate this language simplification and have not been remeasured.

| Check | Result |
| --- | --- |
| TypeScript, `pnpm --filter @workspace/darzi-khata exec tsc --noEmit` | Passed |
| Core finance tests | 29 passed |
| Vitest, offline/storage/design/i18n tests | 39 passed |
| Production mobile Playwright suite | 12 passed |
| Final font change: dark/Urdu layout and production offline tests | 2 passed |
| Impeccable source scan | No findings |
| Impeccable rendered mobile login scan | No findings |
| Lighthouse mobile Accessibility | **100**. Target ≥95 met |
| Lighthouse mobile Best Practices | **100**. Target ≥95 met |
| Lighthouse mobile Performance | **76**. Target ≥85 **not met** |
| Production PWA build | Generated manifest, service worker and precache |
| Offline reload and order save | Passed against the production build |
| Public production release | Not published. User action required |

Commands and configuration are in README.md and playwright.config.ts.
Generated reports are excluded from Git and deployment under
`generated-artifacts/`. Lighthouse HTML/JSON reports are in its `audits/`
subdirectory. The Lighthouse scores measure the signed-out entry page through
the project proxy, not every signed-in route.

## Browser scenarios

Playwright uses isolated storage per test, a 390×844 touch viewport and the
Asia/Karachi timezone. It does not modify the user's real browser data.

1. First-run introduction, empty register and loading isolated demo records.
2. Four-step order creation, measurements, next DK number and persistence after reload.
3. Order editing, all four statuses, and delivering an overdue order.
4. Partial cash payment followed by full Zindigi payment. Paid state, ledger
   entries and 80% digital share agree.
5. Receipt QR after configuring a sample wallet, A4/80mm/58mm selectors and
   URL-encoded Urdu WhatsApp message addressed to a normalized `92…` number.
6. Delete confirmation and Undo preserving the original DK number.
7. Customer history and copying previous measurements into a new order.
8. Insufficient-data credit state, then a scored demonstration profile.
9. PIN setup, reload lock, wrong-PIN error and successful unlock.
10. Export, emptying only the test register, restore and a serial counter no
    lower than the restored highest DK number.
11. Orders, Customers, Hisaab, More, Settings, Credit and Work Sheet at 360px
    in dark Urdu-first mode. Document scroll width does not exceed the viewport.
12. Production service worker installation, offline reload and saving a new order.

A separate signed-in browser pass at 360×844 verified the demo owner's partial
cash/full Zindigi payment journey and visited Orders, Customers, Hisaab, More,
Settings, Credit and Work Sheet. It found crowded labels, navigation overlap
and a date-label problem during live editing. Subsequent fixes use shorter
language-aware customer actions, extra bottom clearance, stacked credit labels,
mobile work-sheet rows and dictionary-based delivery wording. The final
production layout and critical journey tests pass.

## Automated rules

The source regression tests reject hard-coded component/page colours, text
below 12px, decorative ping/bounce/pulse, gradients, all-caps tracking labels,
side stripes and oversized card radii. Dictionary checks validate English/Urdu
entries, interpolation placeholders, used keys and inline Urdu exceptions.
Formatting tests cover PKR grouping, localized short dates and calendar-day
today/tomorrow/late calculations.

Finance and storage tests cover remaining-balance arithmetic, invalid payments,
phone normalization, credit scoring, legacy migrations, backups, photo storage,
atomic recovery and offline persistence. Existing voice parser tests remain.

## Performance work and remaining gap

The initial mobile performance result was 72. Changes included lazy-loading
signed-in dashboards, deferring service-worker installation until fonts and
initial rendering settle, and avoiding a late Nastaliq font swap on slow
connections. The final recorded score is 76. Accessibility and Best Practices
are both 100. Main-thread work remains the principal performance concern.
Do not report the Performance acceptance target as passed.

## Limits and release notes

- There was no exhaustive manual click of every control in both themes.
  Automated critical flows and the signed-in mobile pass provide the coverage above.
- Paper choices and print CSS are implemented. Physical A4, 58mm and 80mm printer
  output has not been verified on hardware.
- The manifest includes standalone display, scoped start URL, theme colour and
  192/512/maskable icons. Service-worker offline behavior is verified. An actual
  Android home-screen installation has not been performed. Current Lighthouse
  does not include the old PWA score/category.
- Payment QR is explicitly a demo payload, not a bank-scannable merchant QR.
  Recording a Zindigi payment is a local ledger entry, not a money transfer.
- Credit and loan figures remain illustrative, not lending decisions.
- Fonts are self-hosted and included in the offline cache. On an initial slow
  connection Urdu may use a fallback font until the cached font is available.
- Temporary Vite hot-reload errors observed while modules were being edited do
  not establish a production failure. The final static build and browser suite pass.
- The support link uses the configured shop contact; no external support number
  has been invented.
- No data formats, account identifiers or original storage keys were replaced.
- Publishing cannot be performed by Agent. README records that no live
  production URL exists for this project yet.
