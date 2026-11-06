---
name: Backup compatibility
description: Why encrypted backup readers must remain compatible across future cryptography upgrades
---

Keep readers for historical encrypted backup envelopes when changing encryption
parameters or export versions. Never silently rewrite existing files or remove
the plain JSON restore path.

**Why:** Backups live outside the app and cannot be migrated when the app updates.
Replacing the accepted encryption parameters outright could make a customer's
only recovery file unreadable, even when they know its passphrase.

**How to apply:** Add explicit version-specific readers for future crypto
upgrades, retain the old reader, and test old files against the current restore
and business-data migration path.
