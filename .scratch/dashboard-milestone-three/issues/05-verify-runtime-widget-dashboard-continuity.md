# 05: Verify Dashboard continuity across runtime Widgets

**What to build:** The completed Dashboard and Weather Widget flow retains the Dashboard behavior users already rely on while proving the runtime Widget platform works across reloads and migration conditions. A user can arrange, remove, and undo runtime Widget Instances, and legacy persisted built-in Widget Instances remain safely unavailable rather than being silently erased.

**Blocked by:** 03: Fetch and present weather inside the Weather Widget; 04: Manage Widget Installations and isolate Unavailable Widgets.

**Status:** ready-for-agent

- [ ] Installed Widget Instances retain Widget Configuration and Grid Layout through Dashboard reload.
- [ ] Drag, resize, removal, and removal undo continue to work for runtime Widget Instances.
- [ ] Legacy persisted built-in Widget Instances remain recoverable as Unavailable Widgets, while reset-to-defaults creates the empty Dashboard seed only through explicit user action.
- [ ] Behavior-focused Dashboard-host, persistence, Widget-Element, and Weather Widget tests cover the finished flow; production builds succeed for both applications.
- [ ] Any inability to run browser assertions because ChromeHeadless is unavailable is reported distinctly from a test failure.
