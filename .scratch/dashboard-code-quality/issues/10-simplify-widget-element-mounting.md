# 10: Simplify the Widget Element mounting lifecycle

**What to build:** Make Widget Element loading and mounting understandable as explicit lifecycle operations while preserving in-place configuration updates and isolation of unavailable or failed Widgets.

**Blocked by:** 09/Separate Widget Installation management from Widget loading.

**Status:** ready-for-agent

- [ ] Mounting clearly separates load initiation, current-attempt checks, element creation, event subscription, rendered attachment, and cleanup.
- [ ] Superseded asynchronous loads and component destruction cannot attach stale Widget Elements or leak event listeners.
- [ ] Valid replacement Widget Configuration events are emitted once, while malformed or throwing event details fail safely and retain the last valid configuration.
- [ ] Configuration updates are assigned to an already mounted Widget Element without recreating it, preserving ADR-0007 behavior.
- [ ] Bundle failures, missing registration, element creation failures, and configuration-assignment failures result in an isolated Unavailable Widget rather than a Dashboard-wide error.
- [ ] Focused lifecycle and race tests remain green together with the Dashboard integration tests.

