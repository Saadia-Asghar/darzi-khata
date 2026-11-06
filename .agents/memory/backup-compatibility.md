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

Do not treat a browser download request as a successfully saved backup.

**Why:** Anchor downloads do not report whether the owner saved or cancelled the
file. Clearing reminders on a click would give false reassurance about recovery.

**How to apply:** Keep explicit owner confirmation before recording a successful
backup unless a future file-saving API can confirm the completed write. Failed,
cancelled, and superseded exports must never advance the saved-backup date.
