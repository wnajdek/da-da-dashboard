# 05: Widget removal with undo

**What to build:** Users can remove a Widget Instance immediately and use a temporary undo action to restore its exact configuration and Grid Layout.

**Blocked by:** 03: Built-in Widget registry and add flow.

**Status:** completed

- [x] Removing a Widget immediately removes it from the Dashboard and persists the change.
- [x] Undo restores the same Widget Instance ID, Widget Type, configuration, order, and Grid Layout.
- [x] The temporary undo action expires cleanly, leaving the Dashboard in its removed state.

## Comments

- Implemented in `40ea38f`. `ng build` and formatting checks pass; Karma builds the full suite but cannot execute browser assertions because Chrome/Chromium is unavailable in this environment.
