# 06: Make Widget Configuration decoding safe and deterministic

**What to build:** Ensure every Widget Configuration entering the Dashboard is safely converted into an application-owned JSON object, so malformed Widget events or saved values cannot throw, hang validation, mutate accepted state later, or silently serialize to a different shape.

**Blocked by:** 04/Organize Dashboard code by feature responsibility.

**Status:** ready-for-agent

- [ ] One focused JSON decoder accepts valid JSON objects and returns an application-owned value.
- [ ] Cyclic, excessively deep, excessively large, throwing, proxy-backed, non-finite, and otherwise non-JSON inputs are rejected without leaking an exception.
- [ ] Shared references that are valid in JSON produce deterministic owned output rather than being retained by reference.
- [ ] Dashboard Snapshot, Widget Manifest, and Widget Element event seams use the decoder where Widget Configuration enters trusted state.
- [ ] Focused tests cover valid nested values and adversarial failure cases, and existing behavior remains green.

