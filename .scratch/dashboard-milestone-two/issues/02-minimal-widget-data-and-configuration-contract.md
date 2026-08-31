# 02: Minimal Widget data and configuration contract

**What to build:** Each built-in Widget renders from its own typed Widget Configuration and obtains reactive deterministic display data through the narrow Widget Data Gateway, while Dashboard management controls remain outside Widget implementations.

**Blocked by:** 01: Registry-driven built-in Widget creation.

**Status:** ready-for-agent

- [ ] KPI, Time-Series, and Notes Widgets receive only the configuration relevant to their Widget Type rather than a complete Widget Instance, Widget Context, Grid Layout, or Dashboard-management API.
- [ ] Widget display data continues to update predictably after the Dashboard refresh action through the Widget Data Gateway.
- [ ] Saving configuration for a visible Widget updates its rendered content in place without recreating its implementation.
- [ ] Widgets do not inject the Dashboard store, and edit/remove controls remain Dashboard-host UI.
- [ ] The existing host-side typed configuration editor and validation behavior continue to work; Widget-provided configuration forms are not introduced.
- [ ] Dashboard-shell and focused Widget tests prove visible configuration and data-refresh behavior, while the new contract remains small and readable rather than becoming a generic event or plugin API.
