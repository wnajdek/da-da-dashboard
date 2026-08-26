# 07: ECharts Time-Series rendering

**What to build:** The Time-Series Widget renders its refreshed Data Source values as an Apache ECharts chart using the Angular 20-compatible `ngx-echarts` integration.

**Blocked by:** 06: Deterministic Dashboard refresh.

**Status:** ready-for-agent

- [ ] The Time-Series Widget renders a readable chart from its resolved Data Source and reflects manual refreshes.
- [ ] ECharts registration is limited to the features used by this Widget and chart options do not enter the persisted Dashboard model.
- [ ] The Widget remains dynamically rendered through the built-in registry and its visible chart behavior is tested.
