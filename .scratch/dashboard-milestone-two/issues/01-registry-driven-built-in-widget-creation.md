# 01: Registry-driven built-in Widget creation

**What to build:** The Dashboard presents only currently registered built-in Widget Types for addition, and creates each new Widget Instance with its Widget Definition's default Widget Configuration and preferred Grid Layout size while the Dashboard retains ownership of identity and placement.

**Blocked by:** None (can start immediately).

**Status:** completed

- [x] A startup-composed immutable Widget Registry is the single source for built-in Widget display metadata, default Widget Configuration, and preferred Grid Layout size.
- [x] Users can add KPI, Time-Series, and Notes Widget Instances with the same useful defaults and host-chosen placement as today.
- [x] The Dashboard store no longer duplicates Widget-Type-specific creation defaults, and the Dashboard shell no longer maintains a separate hard-coded list of addable Widget Types.
- [x] Existing configuration editing, removal/undo, persistence, and Grid Layout behavior remain user-observably unchanged.
- [x] Tests cover adding each registered Widget Type and prove the visible/default persisted results come from the registry-driven flow rather than asserting implementation details.
- [x] The change leaves small, purpose-focused registry and Dashboard responsibilities; no runtime Widget registration or plugin lifecycle abstraction is introduced.

## Comments

- Implemented the static built-in registry as the authoritative source for add-menu labels, default configuration, and preferred size. The Dashboard store still assigns IDs and positions new Widget Instances. Typechecking, formatting, and production build pass; Karma compiles focused and full suites but cannot run browser assertions because Chrome/Chromium is unavailable in this environment.
