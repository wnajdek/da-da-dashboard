# 14: Rebalance Dashboard tests around module interfaces

**What to build:** Give maintainers fast, focused evidence for each Dashboard module while retaining a small number of end-to-end scenarios that prove the complete trusted Widget journey.

**Blocked by:** 10/Simplify the Widget Element mounting lifecycle, 11/Deepen the Dashboard Grid integration, and 13/Extract the Widget Catalog from the Dashboard Shell.

**Status:** complete

- [x] Dashboard Shell tests cover orchestration and a small set of critical user journeys rather than duplicating every lower-level outcome.
- [x] Dashboard state, persistence, domain decoding, Widget Installation, Widget loading, Widget hosting, Catalog, and Grid Layout behavior each have focused tests at their own interface.
- [x] Test fixtures and builders shared by several focused suites have clear domain names and do not expose production private members.
- [x] The integration suite proves installation, Widget Instance creation, Widget Element rendering, configuration persistence across reload, layout persistence, removal undo, and unavailable-Widget containment.
- [x] Obsolete, redundant, or wrongly owned assertions are removed rather than copied into the new suites.
- [x] Dashboard tests, Weather Widget tests, and both production builds pass through documented commands.

## Comments

- Rebalanced the Dashboard Shell suite from broad module duplication to three orchestration journeys, and updated Widget Element lifecycle tests to use public inputs rather than private members. Dashboard (52) and Weather Widget (9) tests plus both production builds pass.
