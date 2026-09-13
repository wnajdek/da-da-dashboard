# 05: Generate an independent Angular Widget Project

**What to build:** A developer can run the project-creation command and receive a complete Angular 20 Widget Project for one Widget Type that can be customized, tested, checked, and built without copying Weather-specific code.

**Blocked by:** 04: Check built Weather Widget conformance.

**Status:** completed

- [x] The command accepts interactive or command-line values for project name, Widget Type, display metadata, distinct Element tags, initial version, and preferred size.
- [x] Invalid names, tags, versions, or layout values are rejected before a partial project is left behind.
- [x] The generated project contains one typed Widget definition, content and settings components, and an author-owned runtime Widget Configuration reader.
- [x] Starter behavior demonstrates explicit invalid-configuration feedback and emits only a validated complete replacement configuration.
- [x] The project includes accessible starter markup and styling without defining a shared Dashboard theming API.
- [x] Project tests and the conformance command pass immediately after generation.
- [x] The production build emits a version-two Widget Manifest and self-contained entry bundle in one ready-to-host directory.
- [x] Generated source contains no Weather terminology, data logic, or imports from Dashboard source.
- [x] Running the generator again or upgrading its packages never overwrites an existing author's application code.
