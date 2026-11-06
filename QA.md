# Darzi Khata verification

## Latest evidence: build 1.4.0+20261106110943Z

Measured on 6 November 2026, 11:10 UTC, against the production build:

- `npx tsc --noEmit`: no diagnostics, exit 0.
- `pnpm vitest run --reporter=verbose`: 4 files, 60 tests passed, including
  all 12 tests in `src/lib/i18n.test.ts`.
- Existing Node finance suite: 29 passed.
- Production Playwright: 16 passed, 1 intentionally skipped. The skipped test
  exercises the development-only worker recovery endpoint.
- Ten actual 390×844 Playwright screenshots: login, orders, new-order form,
  parchi and settings in each language.
- Both WhatsApp message URLs decode into the selected language. Receipt
  headings, style names, payment labels and default thank-you copy follow it.
  Customer-entered names, fabric, addresses and custom notes remain unchanged.
- Urdu document and receipt direction: `rtl`. Back arrows and More chevrons:
  computed CSS `rotate: 180deg`; English arrows have no rotation.
- `npx impeccable detect src/`: 140 files scanned, no source findings.
  Source scanning alone cannot run parsed-page rules. A rendered 390×844
  entry-page scan additionally returned `[]`.
- Lighthouse mobile, simulated 4× CPU throttling: **Performance 100,
  Accessibility 100, Best Practices 100**. LCP 0.9s, TBT 10ms, CLS 0.
  These scores cover the signed-out entry page, not all signed-in routes.

Full unedited command logs, raw Lighthouse HTML/JSON, decoded message text,
computed arrow styles and original screenshots are under
`generated-artifacts/proof/`. The self-contained `verification-report.html`
embeds all ten screenshots and the complete command output.

Failures fixed before the final run: bilingual account/payment labels embedded
inside the dictionary, bilingual receipt shop heading, Roman-Urdu receipt-number
label, English-only style/date/footer copy, and clipped phone-size date fields.
Receipt money now uses the shared grouping formatter. A timestamped More-page
build identifier distinguishes current bundles from stale offline copies.

The older results below are historical and superseded by this run.

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
Impeccable source scan has no findings. Lighthouse has now been remeasured
against the current production build as described below.

| Check | Result |
| --- | --- |
| TypeScript, `pnpm --filter @workspace/darzi-khata exec tsc --noEmit` | Passed |
| Core finance tests | 29 passed |
| Vitest, offline/storage/design/i18n/encrypted-backup tests | 48 passed |
| Production mobile Playwright suite, including startup regressions | 18 passed |
| Final font change: dark/Urdu layout and production offline tests | 2 passed |
| Impeccable source scan | No findings |
| Impeccable rendered mobile login scan | No findings |
| Lighthouse mobile Accessibility | **100**. Target ≥95 met |
| Lighthouse mobile Best Practices | **100**. Target ≥95 met |
| Lighthouse mobile Performance | **99, 100, 100**. Target ≥85 **met in all three runs** |
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

## Mobile performance target verification

The historical scores were 72 and 76. Those reports predate the single-language
sign-in screen. A fresh baseline of the current source, before this task's
optimization, already scored **100**. Do not attribute the entire improvement
from 76 to the changes in this task or treat one runner's timings as a phone
hardware guarantee.

Profiling used Lighthouse's saved Chromium trace and main-thread/bootup
breakdowns on a production Vite build, through `http://localhost/` (the shared
artifact proxy), with its standard simulated mobile network and 4× CPU slowdown.
The historical report showed 1,506ms style/layout, 649ms script evaluation and
1,183ms blocking time. The fresh baseline showed 238ms style/layout, 203ms
script evaluation and 56ms blocking time. Its largest layout event was 46ms
before simulation, while the initial entry bundle was 464kB (149kB gzip).
There is no evidence of the former layout bottleneck on the current entry
screen, so no speculative CSS, font or feature removal was applied.

The remaining avoidable startup work was the eager authenticated shell.
`src/signed-in-app.tsx` now owns routing, the PIN gate, preferences, introduction,
toast/tooltip and query providers. These load only after authentication;
the existing owner and karigar dashboards remain lazy. The entry bundle is
now **284kB (88kB gzip)**, about **41% smaller by gzip**. Authentication, storage
formats, both self-hosted Nastaliq weights, font-display behavior, service-worker
registration and offline precaching are unchanged. The generated precache
contains 29 entries, including the new signed-in chunk and fonts.

Three sequential fresh mobile audits of the finished build, with no concurrent
test/build workload, produced:

| Metric | Run 1 | Run 2 | Run 3 |
| --- | ---: | ---: | ---: |
| Performance | **99** | **100** | **100** |
| Accessibility | 100 | 100 | 100 |
| Best Practices | 100 | 100 | 100 |
| FCP / LCP | 933ms | 915ms | 909ms |
| Total Blocking Time | 148ms | 3.5ms | 0ms |
| Speed Index | 933ms | 915ms | 909ms |
| CLS | 0.00034 | 0.00033 | 0.00033 |
| Style/layout | 419ms | 364ms | 324ms |
| Script evaluation | 297ms | 134ms | 111ms |

Main-thread timings vary in the shared runner; the baseline and final ranges
overlap, so they do not prove a causal CPU-time reduction. The reproducible
bundle reduction and all three scores support the target result.
`generated-artifacts/audits/lighthouse-mobile.report.{json,html}` retains the
**lowest-scoring run (99)** rather than selecting the best result.
`lighthouse-baseline*` and `lighthouse-mobile-run-{1,2,3}*` contain the other
reports and saved traces. These generated files remain excluded from Git.

Reproduction commands (run the managed web workflow in `serve` mode after build):

```bash
pnpm --filter @workspace/darzi-khata typecheck
pnpm --filter @workspace/darzi-khata test
PORT=24310 BASE_PATH=/ pnpm --filter @workspace/darzi-khata build
E2E_BASE_URL=http://localhost E2E_PRODUCTION=1 pnpm exec playwright test \
  e2e/darzi-khata.spec.ts e2e/startup.spec.ts
CHROME_PATH=/repl/tools/bin/chromium pnpm exec lighthouse http://localhost/ \
  --chrome-flags='--headless --no-sandbox --disable-dev-shm-usage' \
  --only-categories=performance,accessibility,best-practices \
  --output=json --output=html --save-assets \
  --output-path=generated-artifacts/audits/lighthouse-mobile
```

TypeScript, production build, 29 core tests, 48 Vitest tests and all 18 production
mobile Playwright scenarios passed. The four new startup cases verify:
signed-out English/Urdu and signup-tab rendering without requesting shop chunks;
real owner and karigar demo sign-in with wrong-password rejection and reload;
and a signed-out installation precaching the lazy shell and both Urdu font
weights before successfully signing in offline. Existing tests verify PIN
unlock, first-run intro, routes, dark RTL layout, order creation, payments,
plain/encrypted backup restore and offline order saving. A 390×844 screenshot
of the finished signed-out page was inspected.

The existing signed-in dashboard still produces a >500kB build warning. The
entry-page Lighthouse target is met; signed-in route performance has not been
scored by these audits.

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
