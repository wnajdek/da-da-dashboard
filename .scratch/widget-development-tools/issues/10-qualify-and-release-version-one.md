# 10: Qualify and release version 1.0

**What to build:** A new Widget Author can use only the publicly released tools and documentation to reach a working preview quickly and produce a conforming Widget that works in their trusted Dashboard environment, establishing the tools as a stable version-one authoring path.

**Blocked by:** 09: Release the public prerelease Widget Development Tools.

**Status:** ready-for-agent

- [ ] A developer unfamiliar with the implementation generates a Widget Project and reaches its working preview within 15 minutes using public packages and documentation.
- [ ] Usability or diagnostic gaps found during that journey are fixed and reverified rather than documented as hidden prerequisites.
- [ ] Weather and the second contrasting Widget use the same release-candidate public interfaces without tool-side special cases.
- [ ] Both Widget Projects pass the same browser-based conformance checks and emit valid self-contained production outputs.
- [ ] Neither Widget Project imports Dashboard source, and a freshly generated project works outside this repository.
- [ ] Dashboard boundary validation, Trusted Manifest Origin enforcement, and Unavailable Widget containment remain intact in the full integration suite.
- [ ] The final documentation states the supported Angular major, Manifest version, trust model, upgrade policy, and version-one exclusions.
- [ ] Stable version 1.0 packages are published only after every readiness criterion in the accepted specification is satisfied.
