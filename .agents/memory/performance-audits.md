---
name: Mobile performance measurements
description: How to interpret shared-runner Lighthouse results without overstating improvements
---

Rebuild and measure the current production source before attributing a historical
Lighthouse gap to current code. Compare multiple sequential runs and retain the
lowest-scoring final report as the headline evidence.

**Why:** A saved low score predated the single-language entry screen; the fresh
baseline already met the target. Shared-runner style/layout and script timings
varied even when the bundle was demonstrably smaller.

**How to apply:** Keep performance audits separate from concurrent builds and
browser suites. Record baseline, final ranges and actual bundle sizes, and avoid
claiming a causal CPU improvement when the timing ranges overlap. Preserve fonts
and offline behavior rather than removing them just to improve an audit.
