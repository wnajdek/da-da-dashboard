# 08: Interactive desktop Grid Layout

**What to build:** Users can arrange all Dashboard Widget Instances through desktop drag and resize handles, while the final portable Grid Layout is persisted independently of GridStack.

**Blocked by:** 04: Typed Widget configuration editor; 05: Widget removal with undo; 07: ECharts Time-Series rendering.

**Status:** ready-for-agent

- [ ] Each Widget can be moved and resized with GridStack through a dedicated drag handle without making Widget content draggable.
- [ ] Completed interactions update the corresponding Widget Instance’s portable Grid Layout and persist it across reload.
- [ ] GridStack-specific objects remain outside Dashboard configuration and Dashboard Snapshot data, with adapter behavior covered by tests.
