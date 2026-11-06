---
name: Offline preview updates
description: Avoid serving stale production UI after returning the shared preview origin to development
---

An installed offline worker can continue serving old screens when the same preview origin switches from a production build back to Vite development. A fresh browser screenshot can show the correct UI while the user's existing browser still shows the old version.

**Why:** The user still saw the former bilingual sign-up page after single-language screens had passed fresh-browser verification.

**How to apply:** Keep development recovery limited to development: an existing worker must be able to fetch a valid replacement at its original script URL, activate it and navigate controlled tabs back to the network. Never clear localStorage or IndexedDB to repair an asset cache. Test with an old active navigation-caching worker, not only a fresh context. Production must retain its real offline worker.
