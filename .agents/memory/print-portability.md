---
name: Portable Urdu PDF downloads
description: Why downloaded PDFs use browser-rendered pages rather than standard PDF fonts
---

PDF downloads preserve browser-rendered Urdu text and QR images as page images.
Native Chrome print-to-PDF retains the browser's text output; downloaded PDFs are
not searchable or accessible text documents.

**Why:** Phone print services are unreliable, and standard PDF fonts cannot
represent the app's Urdu shaping. Download must work locally without a server
or uploading customer data.

**How to apply:** Keep download independent of native printing. If searchable or
accessible downloaded PDFs become a requirement, implement and verify embedded
Urdu fonts and proper text shaping rather than replacing Urdu with Latin-only
PDF fonts or silently losing its glyphs.
