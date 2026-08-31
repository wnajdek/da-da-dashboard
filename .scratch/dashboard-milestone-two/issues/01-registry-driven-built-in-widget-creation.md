# 01: Registry-driven built-in Widget creation

**What to build:** The Dashboard presents only currently registered built-in Widget Types for addition, and creates each new Widget Instance with its Widget Definition's default Widget Configuration and preferred Grid Layout size while the Dashboard retains ownership of identity and placement.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] A startup-composed immutable Widget Registry is the single source for built-in Widget display metadata, default Widget Configuration, and preferred Grid Layout size.
- [ ] Users can add KPI, Time-Series, and Notes Widget Instances with the same useful defaults and host-chosen placement as today.
- [ ] The Dashboard store no longer duplicates Widget-Type-specific creation defaults, and the Dashboard shell no longer maintains a separate hard-coded list of addable Widget Types.
- [ ] Existing configuration editing, removal/undo, persistence, and Grid Layout behavior remain user-observably unchanged.
- [ ] Tests cover adding each registered Widget Type and prove the visible/default persisted results come from the registry-driven flow rather than asserting implementation details.
- [ ] The change leaves small, purpose-focused registry and Dashboard responsibilities; no runtime Widget registration or plugin lifecycle abstraction is introduced.
