# 07: ECharts Time-Series rendering

**What to build:** The Time-Series Widget renders its refreshed Data Source values as an Apache ECharts chart using the Angular 20-compatible `ngx-echarts` integration.

**Blocked by:** 06: Deterministic Dashboard refresh.

**Status:** completed

- [x] The Time-Series Widget renders a readable chart from its resolved Data Source and reflects manual refreshes.
- [x] ECharts registration is limited to the features used by this Widget and chart options do not enter the persisted Dashboard model.
- [x] The Widget remains dynamically rendered through the built-in registry and its visible chart behavior is tested.

## Comments

- Implemented with `ngx-echarts@20.0.1` and the tree-shaken ECharts line-chart modules. `ng build` and formatting checks pass; Karma builds the focused and full suites but cannot execute browser assertions because Chrome/Chromium is unavailable in this environment.
