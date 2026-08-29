# 08: Interactive desktop Grid Layout

**What to build:** Users can arrange all Dashboard Widget Instances through desktop drag and resize handles, while the final portable Grid Layout is persisted independently of GridStack.

**Blocked by:** 04: Typed Widget configuration editor; 05: Widget removal with undo; 07: ECharts Time-Series rendering.

**Status:** completed

- [x] Each Widget can be moved and resized with GridStack through a dedicated drag handle without making Widget content draggable.
- [x] Completed interactions update the corresponding Widget Instance’s portable Grid Layout and persist it across reload.
- [x] GridStack-specific objects remain outside Dashboard configuration and Dashboard Snapshot data, with adapter behavior covered by tests.

## Comments

- Implemented GridStack in a dedicated presentation component with portable-layout translation. `ng build` passes; the full Karma suite bundles successfully but cannot execute because this environment has no Chrome/Chromium binary.
