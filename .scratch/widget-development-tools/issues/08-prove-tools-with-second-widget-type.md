# 08: Prove the tools with a second Widget Type

**What to build:** A Widget Author creates a second, non-Weather Widget Project through the project-creation command and uses it end to end, demonstrating that the public interfaces model Widgets generally rather than Weather accidentally.

**Blocked by:** 05: Generate an independent Angular Widget Project.

**Status:** ready-for-agent

- [ ] The second Widget has a different Widget Configuration shape, presentation, and domain behavior from Weather and does not require a remote weather-style data source.
- [ ] It is created through the public command and uses the same contract and Angular packages without copying Weather implementation code.
- [ ] Its content and Widget Settings UI validate and exchange complete replacement configuration through the standard Element contract.
- [ ] Its generated Manifest and production bundle pass the same conformance checker without Widget-Type-specific exceptions.
- [ ] A Dashboard user can install it, add multiple Widget Instances, change their settings independently, reload them, and remove them without affecting Weather.
- [ ] Any abstraction changes discovered while building it simplify both Widget Projects rather than adding special cases to the tools.
- [ ] Weather, the second Widget, and Dashboard test and production-build suites pass together.

