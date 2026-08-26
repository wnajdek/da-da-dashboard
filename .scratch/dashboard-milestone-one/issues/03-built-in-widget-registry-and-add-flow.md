# 03: Built-in Widget registry and add flow

**What to build:** Users can add KPI, Time-Series, and Notes Widget Instances with useful defaults, and the Dashboard dynamically renders each known Widget Type through its typed built-in registry.

**Blocked by:** 02: Versioned Dashboard Snapshot persistence and recovery.

**Status:** ready-for-agent

- [ ] The user can choose any supported Widget Type and add a visible Widget Instance with an ID, default configuration, and default Grid Layout.
- [ ] Every supported Widget Type resolves to one dynamically rendered standalone Widget component; unknown types cannot enter the Dashboard state.
- [ ] Adding a Widget persists it in the Dashboard Snapshot and remains visible after reload.
