# Dependency vulnerability remediation

Verified on 6 November 2026.

## Audit result

The Replit dependency audit went from **21 findings** (7 high, 12 moderate,
2 low) to **0 findings** across the workspace lockfile. No advisories were
ignored or suppressed.

| Package | Previously affected version | Installed resolution |
| --- | --- | --- |
| body-parser | 2.3.0 | 2.4.0 |
| undici | 7.29.1 | 7.30.2 and 8.12.3 |
| zod | 3.25.76 and 4.6.5 | 4.6.7 |
| glob | 11.1.0 and 13.0.6 | 14.0.3 |
| minimatch | 10.2.6 | 11.0.4 |
| qs | 6.16.0 | 6.17.1 |
| postcss-selector-parser | 6.0.10 | 6.1.5 |
| fast-uri | 3.1.8 | 3.1.9 |
| deepmerge | 4.3.1 | Removed |

The unrelated minimatch 5.1.9 branch remains; it is outside the reported
advisory's affected range. Orval was updated from 8.41.0 to 8.46.0.

## Compatibility changes

- The workspace catalog now uses Zod 4. The order form declares separate
  schema input and parsed output types, preserving number coercion and the
  existing saved-order format without unsafe resolver casts.
- Security floors are recorded in `pnpm-workspace.yaml` for transitive
  dependencies whose latest parents still allow or pin vulnerable versions.
- Glob's maintained 14.x release replaces the vulnerable 11.x/13.x branches.
  Both the PWA build and Lighthouse/tooling dependency graph resolve successfully.
- Minimum release age remains **1440 minutes**. No security exclusions were
  added. Glob 14.0.3 was selected instead of the too-recent 14.0.4.

## Why there is a node-resolve patch

Deepmerge has no patched upstream release. Its only dependency path was
`vite-plugin-pwa → workbox-build → @rollup/plugin-node-resolve`.
Node-resolve used it exactly once to clone a fixed defaults object containing
arrays, strings and booleans before freezing that clone.

The tracked patch in `patches/` replaces that clone with native `structuredClone`
in both CommonJS and ESM entry points. The paired scoped override removes the
now-unused deepmerge dependency. This removes vulnerable code rather than hiding
the advisory. Keep the patch and removal together when updating node-resolve.

Verification checked that defaults and their extension array remain frozen,
extension values are unchanged, the plugin initializes normally, and deepmerge
can no longer be resolved from that consumer.

## Verification

- Offline frozen-lockfile installation passed, including patch integrity.
- Full workspace TypeScript check passed, including shared libraries.
- Unit tests: 60 Vitest tests and 29 existing finance tests passed.
- Web/PWA production build and API production build passed.
- Orval 8.46.0 starts successfully.
- Production Playwright: **20 passed, 1 skipped**. The skipped test is the
  development-only service-worker recovery test. Coverage includes order
  creation/editing, payments, plain/encrypted restore, both language proofs,
  owner/karigar sign-in and offline lazy-tool installation.
- API compressed-body regression: health **200**, malformed gzip with trailing
  bytes **400**, subsequent health **200**. The API did not crash.
- Final dependency audit: critical **0**, high **0**, moderate **0**, low **0**.

Logs and machine-readable audit evidence are in the ignored
`generated-artifacts/security/` directory. This is dependency remediation,
not a claim that static-analysis or privacy/dataflow scans were performed.
