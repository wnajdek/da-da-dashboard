# 03: Lazy rendering for registered Widgets

**What to build:** When a Dashboard card renders for a registered Widget Type, the user sees a small loading state followed by the appropriate built-in Widget implementation loaded lazily and rendered declaratively.

**Blocked by:** 02: Minimal Widget data and configuration contract.

**Status:** ready-for-agent

- [ ] Each registered Widget Definition lazily resolves only its standalone Angular implementation; it does not self-register or return duplicate metadata.
- [ ] A rendered Dashboard card has clear loading and resolved states, with loading initiated at card render time rather than viewport visibility.
- [ ] KPI, Time-Series, and Notes Widget Instances render through one declarative dynamic-rendering path using `NgComponentOutlet`.
- [ ] Multiple instances of a registered Widget Type follow the same resolution path and retain the configuration-update behavior from ticket 02.
- [ ] Eager Dashboard rendering paths no longer statically import Widget implementations, allowing Angular to emit their implementation code outside the initial bundle.
- [ ] Dashboard-shell tests assert observable loading and resolved-widget behavior; production-build output is inspected for Widget implementation chunking without promising changes to GridStack's separate bundle contribution.
- [ ] The renderer owns only card-level resolution state and uses framework APIs appropriate to inline declarative rendering; it does not introduce imperative component-reference plumbing without a requirement.
