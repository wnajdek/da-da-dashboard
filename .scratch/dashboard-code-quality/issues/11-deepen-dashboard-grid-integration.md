# 11: Deepen the Dashboard Grid integration

**What to build:** Give the Dashboard a small, predictable Grid Layout interface that hides GridStack conversion, synchronization, responsive interactivity, and browser viewport observation while persisting only portable domain layouts.

**Blocked by:** 07/Centralize Dashboard domain validation.

**Status:** ready-for-agent

- [ ] Stateless GridStack conversions use focused functions or a justified adapter object rather than a static-only class.
- [ ] Grid column count, layout constraints, breakpoint, cell height, margin, and drag handle configuration each have one authoritative definition.
- [ ] Responsive behavior observes an injectable browser viewport seam instead of reading global window state throughout the component.
- [ ] Adding, updating, and removing rendered GridStack items remains synchronized with Widget Instances without persisting GridStack objects.
- [ ] Drag and resize completion emits only valid final Grid Layout changes, and narrow-screen interaction behavior remains unchanged.
- [ ] Focused conversion, synchronization, and responsive tests remain green.

