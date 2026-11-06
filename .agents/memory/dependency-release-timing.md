---
name: Dependency release timing
description: Recovering from minimum-release-age errors when a pinned child is about to become eligible
---

Pnpm's package-age cutoff is evaluated relative to the installation start.
A child version crossing the maturity threshold during dependency resolution can
still be rejected for that run.

**Why:** A security update's otherwise-compatible parent pinned a child that was
seconds short of the workspace's age requirement. The reported cutoff stayed
at the beginning of the run; a fresh invocation after eligibility succeeded.

**How to apply:** Compare the error's publication timestamp and cutoff before
retrying. Prefer a mature patched release when a newer patch is too recent.
If an exact child pin is nearly eligible, start a fresh install only after its
required age has elapsed; do not disable the age guard or add an exclusion just
to use the latest tag.
