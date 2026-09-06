# 04: Organize Dashboard code by feature responsibility

**What to build:** Make the Dashboard easy to navigate by grouping its workspace, Grid Layout, Widget Installation, and Widget Element hosting modules into coherent feature areas while preserving all imports, behavior, and colocated tests.

**Blocked by:** 02/Standardize Angular dependency injection and 03/Give the Weather Widget its own test target.

**Status:** ready-for-agent

- [ ] Dashboard workspace state and persistence have an obvious shared home.
- [ ] Grid Layout integration, Widget Installation, and Widget Element hosting each have coherent feature-area locations.
- [ ] Source, styles, templates, and focused tests remain colocated with the behavior they describe.
- [ ] The structure does not introduce generic `components`, `services`, `helpers`, or `utils` buckets.
- [ ] All tests and both production builds remain green after the mechanical move.

