# 01: Install a trusted Widget Manifest

**What to build:** A Dashboard user can enter a Widget Manifest URL and install a trusted Widget Type. The Dashboard accepts only URLs from a Trusted Manifest Origin, validates the Widget Manifest, persists the resulting Widget Installation independently from the Dashboard Snapshot, and presents its metadata as an available Widget Type. Invalid, unsupported, duplicate, unreadable, and non-allowlisted Manifest URLs produce clear feedback without changing the user's saved Dashboard.

**Blocked by:** None (can start immediately).

**Status:** completed

- [x] A Dashboard operator-controlled Trusted Manifest Origin allowlist governs every Manifest URL accepted by the installation UI.
- [x] A successfully installed Widget Manifest supplies a stable Widget Type, display metadata, version, Widget Element tag, entry bundle URL, default Widget Configuration, and preferred Grid Layout size.
- [x] Widget Installations and the empty Dashboard Snapshot survive reload independently.
- [x] User-observable tests cover successful installation and every rejected-installation outcome without relying on remote networks.

## Comments

- Implemented the trusted Widget Manifest installation flow with fail-closed operator origin configuration, version-one manifest validation and URL resolution, independent local persistence, duplicate/conflict protection, and available Widget metadata in the Dashboard shell. Production build and full Karma bundle pass; browser assertions remain unexecuted because Chrome/Chromium is unavailable in this environment.
