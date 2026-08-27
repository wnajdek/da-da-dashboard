# 01: Seeded Dashboard shell

**What to build:** A standalone Angular Dashboard screen backed by a signal store that shows one named, seeded Dashboard with KPI, Time-Series, and Notes cards using deterministic Demo Data.

**Blocked by:** None (can start immediately).

**Status:** completed

- [x] A first visit displays “My dashboard” with one seeded Widget Instance of each supported Widget Type.
- [x] KPI, Time-Series, and Notes cards show understandable deterministic demo content through the Dashboard’s signal-backed state.
- [x] The starter screen is replaced by the observable Dashboard experience and its behavior is covered by Angular component tests.

## Comments

- Implemented in `ef38492` and the follow-up commit. `ng build` passes; Karma test bundles compile, but the workspace does not provide a Chrome/Chromium executable for Karma to run the browser assertions.
