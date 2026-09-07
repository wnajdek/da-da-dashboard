# 03: Give the Weather Widget its own test target

**What to build:** Let the independently authored Weather Widget verify its own behavior without making the Dashboard test suite import the Widget's Angular implementation details.

**Blocked by:** 01/Standardize TypeScript private members.

**Status:** completed

- [x] Weather Widget behavior and data-source tests live with the Weather Widget application rather than the Dashboard feature.
- [x] The Weather Widget has a dedicated test target that runs its tests independently.
- [x] Dashboard tests interact with test Widgets only through the documented Widget Element interface.
- [x] The Dashboard test target, Weather Widget test target, and both production builds pass independently.
