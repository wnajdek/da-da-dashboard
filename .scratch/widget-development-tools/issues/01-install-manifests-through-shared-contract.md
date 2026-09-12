# 01: Install Widget Manifests through the shared contract

**What to build:** A Dashboard user can install the same trusted version-two Widget Manifests as today while Manifest and JSON-safe data validation come from a public, framework-neutral contract package that Widget Authors can also consume.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] The contract package exposes the supported Manifest version, Widget Manifest shape, JSON-safe value types and validation, Widget Element configuration shape, and configuration-change event contract without depending on Angular.
- [ ] The Dashboard validates a fetched Widget Manifest through the contract package before creating a Widget Installation.
- [ ] Valid version-two Manifests remain installable with normalized same-origin entry bundle URLs.
- [ ] Invalid, unsupported, or untrusted Manifests still fail with useful installation feedback and are not persisted.
- [ ] Trusted Manifest Origin enforcement, duplicate detection, persistence recovery, and Unavailable Widget containment remain unchanged.
- [ ] Contract and Dashboard tests cover valid and rejected installation paths, and the Dashboard production build passes.

