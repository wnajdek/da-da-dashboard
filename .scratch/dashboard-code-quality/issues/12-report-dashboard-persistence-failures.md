# 12: Report Dashboard persistence failures

**What to build:** Tell Dashboard users when a requested Widget Instance change could not be saved instead of silently leaving the Dashboard unchanged.

**Blocked by:** 07/Centralize Dashboard domain validation.

**Status:** ready-for-agent

- [ ] Adding, configuring, moving, removing, undoing removal, and resetting return or publish explicit success, invalid-input, missing-target, and storage-failure outcomes as applicable.
- [ ] Storage failures leave the last successfully persisted Dashboard state intact and produce accessible user feedback.
- [ ] Invalid or stale commands fail predictably without being conflated with storage failures.
- [ ] Widget Instance identity generation is supplied through a narrow controllable seam instead of direct global access inside the store.
- [ ] Successful removal and undo behavior, including the existing undo window, remain unchanged.
- [ ] Store and user-visible integration tests cover both successful commands and failed persistence.

