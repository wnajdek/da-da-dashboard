# 02: Versioned Dashboard Snapshot persistence and recovery

**What to build:** A Dashboard that retains its state across browser reloads through a versioned local Dashboard Snapshot and gives the user an explicit reset path when saved state cannot be used.

**Blocked by:** 01: Seeded Dashboard shell.

**Status:** ready-for-agent

- [ ] An absent saved Dashboard produces and persists the seeded Dashboard, and a valid saved Dashboard is restored after reload.
- [ ] A malformed, invalid, or unsupported Dashboard Snapshot displays a visible recovery state without silently overwriting saved data.
- [ ] Resetting from recovery explicitly replaces invalid state with the seed Dashboard, with validation and persistence behavior covered by tests.
