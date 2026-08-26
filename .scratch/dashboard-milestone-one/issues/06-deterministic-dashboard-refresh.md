# 06: Deterministic Dashboard refresh

**What to build:** A user-triggered refresh advances local deterministic Demo Data and visibly updates all KPI and Time-Series Widget Instances that use the affected Data Sources.

**Blocked by:** 03: Built-in Widget registry and add flow.

**Status:** ready-for-agent

- [ ] A visible refresh action updates resolved KPI and Time-Series values without any network request or timer.
- [ ] Widget configuration retains Data Source keys rather than storing refreshed presentation values.
- [ ] Refresh results are predictable and covered by behavior-oriented tests for dependent Widgets.
