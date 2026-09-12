# 04: Check built Weather Widget conformance

**What to build:** A Widget Author can run one check against the built Weather Widget and receive precise diagnostics for violations of the actual browser-level Widget contract before installing it in a Dashboard.

**Blocked by:** 03: Render Weather through the Angular integration package.

**Status:** ready-for-agent

- [ ] The checker validates the generated version-two Manifest and verifies that its declared entry bundle exists in the production output.
- [ ] A headless browser imports the built bundle and verifies that exactly the declared content and settings Element tags are registered.
- [ ] The checker proves that both Elements accept configuration assigned before and after connection.
- [ ] The checker observes a bubbling configuration-change event from the Widget Settings Element and rejects non-object or non-JSON-safe detail.
- [ ] A tag collision cannot leave one of the Widget's Elements partially registered.
- [ ] Failures identify the violated contract rule and relevant Manifest field or Element tag instead of returning only a generic failure.
- [ ] A successful check confirms that the Manifest and self-contained entry bundle form a static-hosting-ready output directory.
- [ ] Weather runs the checker through its documented project command in local and continuous-integration environments.

