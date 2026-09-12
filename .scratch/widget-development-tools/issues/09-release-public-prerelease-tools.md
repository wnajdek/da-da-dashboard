# 09: Release the public prerelease Widget Development Tools

**What to build:** A Widget Author can install publicly available pre-1.0 contract, Angular integration, and project-creation packages from npm and follow complete documentation to build a trusted Widget Project.

**Blocked by:** 07: Prove a generated Widget Project is independent; 08: Prove the tools with a second Widget Type.

**Status:** ready-for-agent

- [ ] Available public npm names are selected for the three tools and used consistently in package metadata, generated projects, and documentation.
- [ ] Package exports expose only intentional public interfaces and carry compatible pre-1.0 versions tied to the explicit Widget contract and Manifest version.
- [ ] The Angular package declares support for Angular 20 and reports an understandable incompatibility for unsupported Angular majors.
- [ ] Publication is reproducible, refuses dirty or unverified artifacts, and runs package, Widget, Dashboard, conformance, and independent-project checks before release.
- [ ] Public documentation covers creation, customization, configuration validation, preview, checking, production build, static hosting, CORS, Trusted Manifest Origins, and Manifest reinstallation.
- [ ] Security documentation explains same-page trust, browser-visible credentials, and when a Widget requires its own backend.
- [ ] A project generated from the published packages completes the documented workflow without registry overrides or repository-local dependencies.
- [ ] Release notes identify the packages as pre-1.0 and describe the compatibility and upgrade policy without promising other frameworks or Angular majors.

