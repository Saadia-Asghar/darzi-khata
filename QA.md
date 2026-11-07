# Darzi Khata verification

## Isolated printing and desktop workspace, 7 November 2026

**Verified app source:** `33b89fb0`.
**Actual More-page text in production preview:**
`Version 1.5.0+33b89fb0.20261107071748Z`.
This is the built preview version, not a claim that this build has been
republished. Publishing remains a user action; its build timestamp will differ.

### Changes and failures fixed

- Removed the old live-page print root, React portal and global print rules.
  Receipt, worksheet, consented credit profile and public-profile downloads
  share one isolated, same-origin iframe renderer.
- Print calls **iframe.contentWindow.print()**, never the parent window.
  Only the selected content enters the document. Controls, dialog semantics,
  overlays, navigation, fixed positioning, transforms, max-height and clipped
  overflow are excluded/reset. Paper is white with black text.
- A4 uses 12mm margins. 58/80mm thermal widths use variable roll length with
  a font/print-rounding allowance. QR images remain PNG data URLs.
  Urdu faces are explicitly loaded, followed by the iframe's fonts.ready
  and image decode promises, before marking the document ready.
- Download PDF is a separate local download beside Print on the receipt,
  worksheet and lender profile, generated from that same isolated content.
  No print service, server or customer-data upload is required. Downloads
  use rendered page images to preserve Urdu shaping, so they are not
  searchable/accessibility-tagged text PDFs. Browser print-to-PDF preserves
  the browser's text output.
- Review of the actual generated PDF images found a missing QR in the first
  download renderer. Replaced it with browser SVG/foreignObject rendering,
  embedding the fonts and images; added a raster QR-region ink assertion.
  Urdu A4 overflow and premature thermal page-length measurement were also
  fixed. The final examples are all one page.
- Desktop at >=1024px has logical-start sidebar (right in Urdu), top bar
  with shop/search/language controls and centred, max-1200px content.
  Phone bottom navigation remains below desktop. Tablet begins at 768px.
- More's settings hub has all 12 requested equal-height tiles: 1/2/3 columns
  at phone/tablet/desktop widths, small inline icons and descriptions.
  Settings open in a 560px desktop side panel. The full settings editor also
  uses two columns on desktop; phone section links retain their existing editor.
- Orders have summary/list/selected-detail panes and a functional parchi
  preview. Customers have a desktop searchable table and selected customer
  pane. Hisaab, Credit, Earnings and Impact have multi-column desktop layouts.
  Desktop dialogs are at most 560px; measurement fields use three columns.
- Horizontal clipping is not used to mask layout problems. Tests check both
  document width and visible boxes (excluding intentional internal chip scrollers).

### Reproduction / browser evidence

The new desktop-sidebar and iframe assertions were run against the previous
built app first: **2 failed**, with the sidebar and print iframe absent.
The later QR pixel assertion also failed against the first download renderer
before that renderer was replaced. These are genuine pre-fix failures, not
intentionally broken fixtures.

Final command (production build, Chromium):

```sh
E2E_PRODUCTION=1 pnpm exec playwright test \
  e2e/responsive-print.spec.ts e2e/bug-regressions.spec.ts \
  --grep 'responsive pages|isolated receipt|thermal receipt|worksheet and consented|BUG 1: print'
```

```text
Running 18 tests using 1 worker
18 passed (3.8m)
```

- Eight responsive matrix cases: EN/Urdu x 375, 768, 1366, 1920px.
  Screenshots for Orders, Customers, More, full Settings, Hisaab, Credit,
  Impact, New order and measurements; desktop settings panel also captured.
  **76 screenshots** in `qa-screens/responsive/`.
- Every page also checked at boundary widths 320, 360, 767, 1023 and 1024px.
  Sidebar visibility/side, hidden desktop bottom nav, tile count/columns,
  customer details, parchi preview and form layout asserted.
- Four receipt cases: EN/Urdu x **375x812 and 1366x768**.
  Tests intercept only the iframe print call; the parent print function throws.
  They serialize the exact isolated document into a capture page for Chromium
  page.pdf (Playwright cannot directly PDF a child frame).
  PDF text contains DK-001, Customer A and 1,500; embedded image asserted
  with pdfimages; menu/settings/nav absent; pdfinfo and PDF page objects
  confirm **one A4 page**. Downloaded PDFs are also one page, and rasterized
  QR regions contain ink rather than the previous blank image.
- Four EN/Urdu thermal width/page cases; one additional A4 isolation case;
  one worksheet + consented lender-profile Print/Download journey.
- Independent signed-in browser check passed: demo -> desktop More ->
  editable Payment side panel -> close without changes -> top-bar search ->
  DK-138 parchi with adjacent Print/Download -> Urdu right sidebar/settings ->
  375px phone bottom nav. No app errors observed.
- Preview workflow healthy; no new browser console errors.
  No physical printer, Android print service or iOS print sheet was tested.

### Typecheck / unit tests / build

```text
$ pnpm typecheck
scripts typecheck: Done
artifacts/api-server typecheck: Done
artifacts/mockup-sandbox typecheck: Done
artifacts/darzi-khata typecheck: Done

$ pnpm test
ℹ tests 29
ℹ pass 29
ℹ fail 0
Test Files  10 passed (10)
     Tests  118 passed (118)
```

The Vitest set includes i18n and design-lint regressions. Production Vite
build and PWA generation passed. Full unabridged command output, final
Playwright summary, native/download PDFs, PDF-rendered PNGs and all responsive
screenshots are included in the downloadable evidence ZIP.

Evidence working files: `generated-artifacts/responsive-print/`.
English and Urdu PDF screenshots: `parchi-en-1366-pdf.png`,
`parchi-ur-1366-pdf.png`; native PDFs and download counterparts also included.
Desktop More/settings captures: `desktop-settings-en.png`,
`desktop-settings-ur.png`. Evidence is generated output, excluded from Git and
deployment to avoid repository bloat; source/tests and this report are committed.

## Landing login entry follow-up, 7 November 2026

App source `a75bd2d`: Open app and Start free, in both header/hero and footer,
open `/app/login` with the Login tab selected. A retained demo/account session
must not bypass that explicit login page. Only Try demo shop auto-opens demo.
Direct `/app` launches may still resume an existing session for installed use.
No accounts, orders or demo data are cleared.

The old Open app link targeted `/app` when a session existed, and AppShell
redirected authenticated visits away from login. Both entry paths are fixed.
Typecheck, 29 core checks, 118 Vitest tests and five targeted browser cases
passed: all four CTA copies in English/Urdu before/after a demo visit, reload,
wrong-password gate, successful login, preserved stored data, explicit demo,
owner/karigar sign-in and signup/password/account-isolation regressions.
These results are for the production build in preview, not a new publication.

## Individual delivery status follow-up, 7 November 2026

App source `23afdb4`: keep cards in their current positions when changing an
individual status in All, and confirm the specific order number/customer.
Explicit filter/search changes and reload restore active-first sorting.
No other order statuses are rewritten.

Verified against the production build: workspace typecheck, 29 core checks,
118 Vitest tests, and three targeted Playwright scenarios passed. English and
Urdu regressions check four orders (including two sharing a customer), exact
unchanged other records, stable card positions, repeated Delivered selection,
reload persistence, and that the Delivered filter only filters the view.
This is preview evidence; publishing is still required for the live domain.

## Judges release, 7 November 2026

**Release source:** `d743ac63`. Actual More-page text:
`Version 1.5.0+d743ac63.20261106211440Z`.
Urdu: `ورژن 1.5.0+d743ac63.20261106211440Z`.
The version identifies the latest commit changing the app directory; later
QA/checkpoint metadata-only commits do not change the application source.

### Important: preview is not the published site

All PASS results below are against the **production Vite build in preview**,
not the public deployment. The live domain was checked again after pushing:
it still returned the old bilingual title and old login page. A Publish action
has been shown. **Republishing and public-domain acceptance are BLOCKED until
the user clicks Publish.** No claim is made that the live site was updated.
Do not clear customer storage or uninstall the PWA to update it.

### Pass/fail checklist

| Requirement/flow | Production-build preview |
|---|---|
| `/` landing; `/app` signed-out login; installed PWA starts `/app` | PASS |
| English and Urdu login, order list, new form, parchi, Settings screenshots | PASS |
| Intro Skip and final Next persist after reload in both languages | PASS |
| Header fits 320/360/375 px; shop and owner truncate; small inline Demo; lock icon | PASS |
| In-app language selection in Settings, not shop/tool headers | PASS |
| Today counts active due-today deliveries; deduplicated ready/late/today balances; no zero-only message | PASS — pure calendar/payment tests |
| Actual Pending/Stitching/Ready/Delivered status; separate red lateness | PASS |
| Built-in/legacy fabric and demo text display in selected language; custom text preserved | PASS |
| Notes is labeled; overflow Edit/Delete only; paid payment action replaced by Paid; no More badge or intro icon tile | PASS |
| Signup, empty account, first order with two garment types | PASS — automated and manual-browser evidence |
| Parchi, A4/58/80 mm print and print-media controls hidden | PASS |
| Saved-customer reuse; other customer's edit does not change first customer | PASS |
| Quick order promoted to full form preserves selected saved measurements | PASS — regression confirms 42 stays 42, saved profile unchanged |
| Partial cash and full simulated QR payments update balances/credit | PASS — no real bank payment claimed |
| WhatsApp 92-normalized number, selected-language message/parchi and RTL arrows | PASS — intercepted handoff/message checks; no message sent |
| Lender profile without login, read-only consent, expiry/tamper checks | PASS |
| Guided pitch finishes with the same recomputed credit score | PASS |
| Wrong password rejected; accounts remain isolated | PASS |
| Offline reload and save after install | PASS |
| Existing worker replaced, refresh notice displayed, stored sentinel preserved | PASS |
| All 12 main/tool routes dark, English/Urdu, 375×812 | PASS — 24 screenshots and automated contrast checks |
| Eight `/screens/*.webp` respond 200; OG image 1200×630 with image metadata | PASS in preview; public assets need Publish |
| README live URL, credentials, three screenshots, five-step pitch | PASS |
| README full team names | BLOCKED — names were requested but not supplied |
| Published landing, current More version and real WhatsApp OG preview | BLOCKED — Publish needed; third-party WhatsApp preview not asserted |

### Commands and evidence

- `pnpm typecheck`: PASS, entire workspace.
- In `artifacts/darzi-khata`, `npx tsc --noEmit`: exit 0, no diagnostics.
- `pnpm test`: 29 core checks plus 118 Vitest tests in 10 files passed,
  including `i18n.test.ts`.
- In the app directory, `pnpm vitest run`: 118 passed. The root command is
  unavailable because Vitest is installed in the app package, not the root.
- Playwright: **65 unique scenarios passed, 1 intentional production-only
  skip**. Initial pass exposed two dark-mode failures, subsequently fixed.
  A manual browser pass found Quick→Full dropping saved measurements; fixed
  and covered by a new regression. This total combines the original pass
  with targeted successful reruns, not an invented single clean run.
- `npx impeccable detect src/`: 170 source files scanned, no regex findings.
  This is a source-only scan; its parsed-page/contrast rules did not run.
- Additional axe color-contrast scan: **24 route/language checks, 0 detected
  violations** after fixing payment/loan buttons and the credit badge.
  Five pages have incomplete SVG/chart regions; this is not a full WCAG
  certification.
- Production build succeeds, managed Vite preview running, final smoke
  reports no page errors and verifies both-language More strings against
  the source SHA.

### Lighthouse mobile — two isolated final-build runs

Scores below use the lower score of both runs for each category.
Lighthouse uses its mobile preset; 375×812 refers to the Playwright screenshots.

| Route | Performance | Accessibility | Best practices | SEO |
|---|---:|---:|---:|---:|
| Landing, cold | 91 | 100 | 100 | 100 |
| Login, cold | 100 | 100 | 100 | 100 |
| Signed-in demo order list | 99 | 100 | 100 | 92 |

Landing performance runs were 91/99; order list 99/100.
Signed-in order-list auditing preserves the signed-in session and installed
app resources; it is **not** presented as a cold signed-out load.
No claim that these are measurements of the outdated published domain.

### Files

- `qa-screens/en/`, `qa-screens/ur/`: light proof, print-media, 12 dark pages
  each, and final More version captures. Generated/ignored, not user data.
- `generated-artifacts/judges/`: exact command output, initial failures,
  successful reruns, release smoke JSON, contrast output and Lighthouse
  HTML/JSON. Downloadable HTML and ZIP contain the evidence.
- Updated actual 375×812 screenshots and social image are tracked under
  `artifacts/darzi-khata/public/screens/`.

### Public acceptance after Publish

Open a fresh browser at the public `/`, confirm the landing (not login).
Open `/app`, confirm login; check all eight WebP assets and OG metadata.
Then open an already-installed PWA, accept its refresh notice, verify
the new source version in More and confirm existing data remains intact.
This last public/installed-device pass has **not** been claimed as complete.

## Landing, routed app and shop tools, 6 November 2026

Current verification evidence is in `generated-artifacts/launch/`. Earlier
sections below are history, not results for this build.

### Commands and actual results

- `pnpm typecheck`: exit 0 across the workspace.
- `pnpm test`: 29 finance/core checks and 112 Vitest tests across 9 files passed.
  This includes `i18n.test.ts`, `design-lint.test.ts` and the new shop-tool,
  backup-field and signed-link tests.
- Production build: passed with `PORT=24310 BASE_PATH=/`.
- `npx impeccable detect src/`: 167 source files scanned, no source-regex
  findings. The tool explicitly says source mode does **not** check rendered
  contrast/tiny elements; do not present it as a full visual-accessibility audit.
- Playwright: **59 unique scenarios passed, one intentionally skipped**.
  The complete first run was 53 passed, 3 failed, 1 skipped. The failures were
  test-harness issues: one successful login was followed by navigation before
  asynchronous password verification finished, and two receipt screenshot cases
  chose an already-paid order, which correctly has no payment QR. Those
  assertions were corrected, not hidden. An 8-test focused run then passed;
  a further 10-test run passed after order-list batching/lazy chart loading,
  including the new full-register search/load-more check. The production-only
  run deliberately skips the development cache-recovery-worker test.
  After deferring closed forms, another 8 affected-flow checks passed, followed
  by both final language/screenshot proofs (2 passed).
- Raw logs: `typecheck.txt`, `tests.txt`, `build.txt`, `playwright.txt`,
  `rechecked.txt`, `list-optimization-checks.txt`, `impeccable.txt`.
- `landing-js.json` records actual requested script sizes both raw and gzip.
  The 150 KB budget is assessed as **compressed JavaScript**, not uncompressed
  source; this distinction is intentionally visible in the evidence.

### Current mobile Lighthouse

Two sequential isolated Lighthouse runs used the current production build and
default mobile throttling. Headline results retain the **lower** final score,
not the best run.

| Route | Performance | Accessibility | Best practices | SEO |
|---|---:|---:|---:|---:|
| `/` landing | **97** | 100 | 100 | 100 |
| `/app/login` | **100** | 100 | 100 | 100 |
| `/app` signed-in, 150-order demo register | **92** | 100 | 100 | 100 |

Ranges were 97–99 for landing and 92–93 for signed-in orders. The signed-in
measurement preserved the existing demo session and installed offline assets;
it is **not** a cold, cache-cleared authenticated load. Login/landing were
fresh-browser measurements. Initial signed-in performance was 75 before batching
and on-demand chart/form mounting. A batch/chart-only intermediate run scored
78; deferring the closed forms' storage hooks removed further startup work.
These are shared-runner measurements, not a guarantee of every real device's
score.

Final More-page build text: `Version 1.4.0+20261106172244Z`.
Final Urdu proof confirms document and parchi `dir=rtl`, both directional
icons rotated `180deg`, translated WhatsApp/parchi labels, and no page errors.
Names, addresses and user-entered descriptions remain exactly as stored rather
than being machine-translated.

### Screen and control coverage

| Screen/control | Result | Important behavior |
|---|---|---|
| Landing, English/Urdu | Passed | Single language, correct direction, real images, mobile overflow check |
| Start free | Passed | `/app/login?mode=signup`, sign-up form visible |
| Try demo shop | Passed | Actual isolated demo account and synthetic order data |
| Installed PWA start | Passed | Standalone mode bypasses landing; manifest starts at `/app` |
| Order list | Passed | First 20 rendered; Show more adds 20; search and totals use all records |
| Existing orders/forms/customer history | Passed | Create/edit/status/delete/undo and shared-phone isolation preserved |
| Hisaab | Passed | Existing payment ledger plus real received-income/expense/profit calculation |
| Parchi and WhatsApp | Passed | Selected language, QR only for unpaid orders, user sends the draft |
| A4/58mm/80mm printing | Passed | Isolated print root, one-page receipt and thermal width checks |
| Settings/tool pages | Passed | Routed under `/app`, back button and language switch |
| Pitch demo | Passed | Resets demo only; real ledger payment; zero baqi; actual model score matches credit page |
| Lender sharing | Passed | Consent required; no login on recipient page; signature and seven-day expiry checked |
| Lender PDF action | Implemented | Uses the shared isolated print/PDF path; choose Save as PDF |
| Baqi recovery | Passed | Customer IDs, amount/age sorting, recovered-month amount, WhatsApp draft containing QR-page link |
| Rush planner | Passed | Worker/day capacity, due suits, shortfall and suggested cut-off |
| Expenses | Passed | Save/reload, categories, positive amounts, correct profit, backup validation |
| Customer tracking | Passed | Read-only signed status snapshot without login; no customer contacts/measurements |
| Savings/committee | Passed | Target, percentage suggestion, dated saved contribution; no money transfers |
| Women home-tailor mode | Passed | Simpler home, ladies' garments first, phone privacy choice, lender badge |
| Backups/PIN/accounts | Passed | Plain/encrypted restore, wrong passphrase rejection, session/PIN and shop isolation |
| Mobile themes | Passed | 360×800/390×844, English/Urdu, dark/light; no overflow or text below 12px |

### Scope and safety notes

- Real saved user data was not cleared. Tests used isolated browser contexts
  with synthetic accounts/orders/photos.
- QR payments and the score remain illustrative, not bank-verified. The
  landing page now says explicitly that a live merchant QR requires an
  authorised bank integration.
- Lender/status links are **snapshots**, not a live feed. Send a new link after
  updates. Anyone holding a link can read it until expiry; offline links cannot
  be revoked early. Signatures verify link integrity, not business identity.
- Financial settings travel with existing plain/protected backups; restore
  validates them before writing.
- Native sharing, WhatsApp Send, physical camera/printer behavior and a real
  Android/iPhone installation were not claimed as hardware-tested. No message
  or real bank transaction was sent.
- Team-member names and a public WhatsApp contact were not available. The app
  does not invent them. The GitHub repository link is present.
- The live URL is verified as `https://darzi-khata.replit.app`; pushing to GitHub
  does not publish this source to that deployment.

## Local backup reminders, 6 November 2026

- `pnpm --filter @workspace/darzi-khata typecheck`: passed.
- `pnpm --filter @workspace/darzi-khata test`: 29 core tests and 77 Vitest tests passed.
  Includes 17 reminder/export regression tests covering opt-in, dismissal,
  register changes, per-shop/demo isolation, quota rollback, changes during an
  export, invalid restore, both export formats, interrupted/failed downloads,
  and the explicit saved-file confirmation boundary.
- `PORT=24310 BASE_PATH=/ pnpm --filter @workspace/darzi-khata build`: passed.
  Existing source-map reporting and large-chunk warnings remain.
- One signed-in browser pass at 390×844 verified reminder opt-in, dismissal
  across reload, reappearance after an order edit, navigation to the backup
  section, plain export cancellation/confirmation, encrypted export and
  passphrase cancellation, local metadata privacy, and English/Urdu RTL layout.
  No horizontal overflow was observed on the changed backup settings.
- That browser pass flagged language switching as re-triggering a reminder.
  Fixed by excluding display preferences from business-register comparisons;
  the added regression test checks language, theme, font and paper changes,
  including an in-flight export snapshot. Confirmed by the passing final unit
  suite above, not a second browser pass.
- The browser cannot attest that an anchor download reached the owner's files.
  The interface therefore requires “I saved the file” before updating the last
  confirmed backup date, and never counts the download request alone.

## Print, customer isolation and account verification — 6 November 2026

### Commands and results

Run TypeScript and Vitest from `artifacts/darzi-khata`:

```text
$ npx tsc --noEmit
(no output; exit 0)

$ pnpm vitest run
Test Files  6 passed (6)
     Tests  67 passed (67)
```

Includes `i18n.test.ts`, customer/migration regressions, password/deep-freeze,
offline storage, design-source rules and protected-backup compatibility tests.
The separate finance runner passed 29 tests. The production PWA build passed.

Before fixes, `e2e/bug-regressions.spec.ts` produced:

```text
3 failed
  BUG 1: print isolates the complete receipt and exports one A4 page
  BUG 2: editing customer A never renames or changes customer B
  BUG 3: customer validation contains only the chosen language
```

The initial unit regressions also failed all four checks (customer ID priority,
detached nested data, and selected-language errors in English and Urdu).
An additional invalid-phone migration test first failed, then passed after
removing invalid contact numbers from legacy matching.

Final verification covers **46 distinct passing Playwright scenarios and one
intentional skip**, across the main run and focused reruns. The main run had
36 passes, one development-only skip, and two outdated test assertions:
the demo test needed to wait for onboarding, and history now navigates by
customer ID instead of a phone. Both corrected assertions passed in the final
three-test rerun, along with the full customer-edit/template/quick-order flow.
The eight additional team/reminder/share scenarios all passed. No passing
unrelated scenarios were rerun solely to replace the earlier log.

### Walk-through table

Mobile matrix: **360×800 and 390×844 × English/Urdu × light/dark**.
All eight combinations passed layout, minimum 12px text, selected-language
copy and dialog-height checks. Eight further matrix scenarios monitored browser
console errors and uncaught exceptions and exercised team/reminder/share actions.

| Screen | Controls / behavior verified | Works | Fixed |
| --- | --- | --- | --- |
| Login/signup | Required fields, bad email, short password, mismatch, duplicate email, signup, password eye | Yes | Salted PBKDF2 passwords; signup validation; fresh account opens at home |
| Session | Right/wrong password, reload, logout, A/B accounts, demo login | Yes | Preserve legacy hashes until verified login, then upgrade; keep account namespaces separate |
| Account data | Orders, customers, photo display, templates, settings and demo separation | Yes | Test A's data remains available after B/demo; no A records or photos displayed in B |
| PIN | Set, reload, wrong/right PIN, fifth-failure lockout, timer, Lock now | Yes | Existing behavior retained and tested |
| Orders | Search/filter/status, receipt, edit, payment, delete confirmation, undo | Yes | Retained existing order actions; customer links now use IDs |
| Full order | Four steps, next/back, garment types/items, measure +/- buttons, style, bill, save/reload | Yes | Detached item and legacy measurements; only one measurement-label language |
| Templates | Name dialog, save, select from list, apply measurements and styles | Yes | Replaced native prompts; copy measurements rather than retain live references |
| Quick order | Pick a saved customer/profile, choose garment, price/date, save | Yes | Lookup by selected customer ID; detached measurement objects |
| Customers | Search, editor, history, quick order | Yes | ID-based association even for identical normalized phones |
| Customer editor | Name, notes, profile add/edit, measurements, save/validation | Yes | Deep-copy draft; duplicate phone no longer redirects edits to another customer |
| Customer history | Open by ID, copy measurements into a new order | Yes | Distinct histories for customers sharing a phone; legacy phone URLs remain readable |
| Parchi | Open/close, A4/58/80 paper choice, WhatsApp text/URL, QR | Yes | Shared isolated print root; no dashboard underneath or clipped modal |
| Print/PDF | Full A4 receipt, 58/80mm roll width, QR, Urdu RTL/font, afterprint cleanup | Yes | One-page PDF assertions for the standard A4 receipt and four English/Urdu thermal cases |
| Work sheet | Open, print, return to screen | Yes | Same print helper; handles page-mode region as well as modal mode |
| Payments | Full amount, cash/Zindigi/Raast/bank selection, partial/full save, history | Yes | Payment-method controls/history show only the selected language |
| Credit | Empty/scored states, consent, create profile, isolated print | Yes | Same print helper; selected-language shop type |
| Impact | Metrics, chart/table, scroll | Yes | Removed bilingual shop-type summary |
| Reminders | Payment reminder button and generated WhatsApp intent | Yes | Selected-language button and reminder text |
| Team/karigar | Activity/add/invite tabs, copy/share invite, confirm removal, search/relink member | Yes | Retained team functions; karigar logout uses AlertDialog instead of confirm |
| More | Tool navigation, share, logout, language controls | Yes | Existing navigation preserved; no duplicated helper copy |
| Settings | Save/reopen, language/theme, receipt preview, PIN, plain/protected backups | Yes | Preview follows selected language; all stored settings remain scoped |
| Error/recovery | Selected-language error fallback, development freeze guard | Yes | Removed bilingual error fallback; nested mutation throws under development guard |

Print is verified with emulated print media, screenshots and Chromium PDFs,
not by controlling the operating system's print window. Share/clipboard and
WhatsApp intents are intercepted in isolated test browsers: no message is sent
and no real phone call is made. Voice recognition, native share sheets,
camera hardware and an installed WhatsApp application are not device-tested.
The QR remains explicitly a non-bank-scannable demo placeholder.

### Evidence

All raw failing/passing logs and printable screenshots/PDF are in the ignored
`generated-artifacts/bugs/` directory. The downloadable verification report
embeds those logs and print screenshots. Original business data was not cleared;
browser tests used isolated contexts and synthetic records.

---

## Earlier verification history

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
