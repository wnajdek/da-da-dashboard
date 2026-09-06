# 09: Separate Widget Installation management from Widget loading

**What to build:** Give callers a small Widget Installation management interface and a separate Widget Element loading interface, hiding manifest acquisition, trust checks, persistence, script loading, registration checks, and concurrent-load handling behind the module that owns each behavior.

**Blocked by:** 08/Separate Widget Installation contracts from persistence.

**Status:** ready-for-agent

- [ ] Installing, listing, resolving, and removing Widget Installations are owned by one focused state module.
- [ ] Loading and verifying a Widget Element is owned by a separate focused module.
- [ ] Trusted Manifest Origin enforcement, same-origin entry-bundle validation, duplicate detection, and Unavailable Widget outcomes remain unchanged.
- [ ] Browser manifest fetching, script insertion, and Custom Element registry access are concentrated behind narrow injectable adapters rather than spread through UI code.
- [ ] Installation operation results are sufficient for callers to present feedback without a globally shared presentation-message state.
- [ ] Focused tests exercise each interface through controlled adapters, and existing integration behavior remains green.

