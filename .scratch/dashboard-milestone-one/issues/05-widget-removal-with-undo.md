# 05: Widget removal with undo

**What to build:** Users can remove a Widget Instance immediately and use a temporary undo action to restore its exact configuration and Grid Layout.

**Blocked by:** 03: Built-in Widget registry and add flow.

**Status:** ready-for-agent

- [ ] Removing a Widget immediately removes it from the Dashboard and persists the change.
- [ ] Undo restores the same Widget Instance ID, Widget Type, configuration, order, and Grid Layout.
- [ ] The temporary undo action expires cleanly, leaving the Dashboard in its removed state.
