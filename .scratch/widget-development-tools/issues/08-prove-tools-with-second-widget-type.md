# 08: Prove the tools with a second Widget Type

**What to build:** A Widget Author creates a second, non-Weather Widget Project through the project-creation command and uses it end to end, demonstrating that the public interfaces model Widgets generally rather than Weather accidentally.

**Blocked by:** 05: Generate an independent Angular Widget Project.

**Status:** completed

- [x] The second Widget has a different Widget Configuration shape, presentation, and domain behavior from Weather and does not require a remote weather-style data source.
- [x] It is created through the public command and uses the same contract and Angular packages without copying Weather implementation code.
- [x] Its content and Widget Settings UI validate and exchange complete replacement configuration through the standard Element contract.
- [x] Its generated Manifest and production bundle pass the same conformance checker without Widget-Type-specific exceptions.
- [x] A Dashboard user can install it, add multiple Widget Instances, change their settings independently, reload them, and remove them without affecting Weather.
- [x] Any abstraction changes discovered while building it simplify both Widget Projects rather than adding special cases to the tools.
- [x] Weather, the second Widget, and Dashboard test and production-build suites pass together.

## Comments

- Added the independently authored Focus Timer Widget Project, generated with
  `npm run create:widget` and then customized with local countdown behavior.
  Its complete configuration is `{ task, durationMinutes }`; it uses no remote
  data source.
- The Dashboard lifecycle test covers Weather plus two Focus Timer Widget
  Instances, distinct persisted configuration replacements, reload, and
  removal. The Focus Timer's browser tests cover its Settings UI's bubbling
  `configuration-changed` replacement.
- The Angular integration now peers on the shared contract, so a generated
  project consumes one explicit contract version rather than resolving an
  unpublished transitive package.
- Verified with Dashboard, Weather, Focus Timer, generator, definition, and
  dual-widget production conformance checks.
