# 02: Build Weather from one typed Widget definition

**What to build:** A Widget Author changes Weather's identity, metadata, Element tags, defaults, and preferred Grid Layout size in one typed Widget definition, and the Weather build produces the version-two Widget Manifest used by the Dashboard.

**Blocked by:** 01: Install Widget Manifests through the shared contract.

**Status:** ready-for-agent

- [ ] Weather has one authoritative typed definition for every field published in its Widget Manifest.
- [ ] The production build generates the deployable Manifest from that definition rather than copying a separately maintained JSON source.
- [ ] Weather registration and contract-facing tests consume the same Element tags and defaults without duplicating literal values.
- [ ] Generated Manifest output is deterministic and rejected at build time when the definition violates version-two contract rules.
- [ ] The generated Manifest and bundle remain installable from a Trusted Manifest Origin and render the existing Weather content and Widget Settings UI.
- [ ] Weather tests, Dashboard integration tests, and both production builds pass.

