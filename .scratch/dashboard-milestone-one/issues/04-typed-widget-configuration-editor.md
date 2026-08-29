# 04: Typed Widget configuration editor

**What to build:** Selecting a Widget Instance opens a side-panel editor with the correct typed reactive form, allowing valid configuration changes to appear in and persist from the Dashboard.

**Blocked by:** 03: Built-in Widget registry and add flow.

**Status:** completed

- [x] KPI, Time-Series, and Notes Widget Instances each expose only their relevant editable configuration fields.
- [x] Required titles, valid Data Source choices, and safe display limits show inline errors and prevent saving invalid configuration.
- [x] A successful save visibly updates the selected Widget and persists across reload.

## Comments

- Implemented typed reactive forms in the Widget configuration side panel. `ng build` passes; Karma bundles the complete suite but cannot run browser assertions because this environment has no Chrome/Chromium executable.
