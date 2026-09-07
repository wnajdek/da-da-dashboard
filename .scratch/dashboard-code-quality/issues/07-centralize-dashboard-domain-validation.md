# 07: Centralize Dashboard domain validation

**What to build:** Give the Dashboard one authoritative decoding path for Widget Types, Grid Layouts, Widget Instances, and Dashboard Snapshots so valid data is accepted consistently and malformed data reaches the existing explicit recovery flow.

**Blocked by:** 06/Make Widget Configuration decoding safe and deterministic.

**Status:** completed

- [x] Widget Type has one documented invariant used by manifests, saved Widget Instances, and Dashboard commands while still permitting valid Unavailable Widgets.
- [x] Widget Type is represented honestly as a string or as a genuine validated brand rather than an ineffective intersection type.
- [x] Grid Layout validation consistently enforces the integer, positivity, and grid-width constraints required by the Dashboard and GridStack.
- [x] Dashboard decoding validates identity, title, Widget Instance uniqueness, type, layout, and owned Widget Configuration in one authoritative module.
- [x] Persistence delegates structural decoding to that module, while pure stateless helpers remain module-level functions rather than artificial instance methods.
- [x] Duplicate validators and unused or misleading JSON type re-exports are removed, with focused recovery and validation tests remaining green.
