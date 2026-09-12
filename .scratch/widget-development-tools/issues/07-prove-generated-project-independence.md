# 07: Prove a generated Widget Project is independent

**What to build:** A developer can consume packed Widget Development Tools in a fresh location outside the Dashboard monorepo and complete the entire create, preview, test, check, build, serve, and local-install journey.

**Blocked by:** 06: Preview Widget content and settings locally.

**Status:** ready-for-agent

- [ ] All three tools produce valid npm package artifacts containing only the files required by their public interfaces and commands.
- [ ] A clean-environment verification installs those artifacts without workspace links, unpublished transitive packages, or Dashboard source paths.
- [ ] The installed project-creation command generates a new Widget Project successfully outside this repository.
- [ ] The generated project's preview, unit tests, conformance checks, and production build pass using only declared dependencies.
- [ ] Its served Manifest can be installed from an allowlisted local origin and its Widget Instance can render and save settings in the Dashboard.
- [ ] The verification fails if the generated project imports Dashboard source or relies on undeclared monorepo configuration.
- [ ] The independent journey is repeatable through an automated smoke test wherever browser execution permits.

