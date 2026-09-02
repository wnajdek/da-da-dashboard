# 01: Install a trusted Widget Manifest

**What to build:** A Dashboard user can enter a Widget Manifest URL and install a trusted Widget Type. The Dashboard accepts only URLs from a Trusted Manifest Origin, validates the Widget Manifest, persists the resulting Widget Installation independently from the Dashboard Snapshot, and presents its metadata as an available Widget Type. Invalid, unsupported, duplicate, unreadable, and non-allowlisted Manifest URLs produce clear feedback without changing the user's saved Dashboard.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] A Dashboard operator-controlled Trusted Manifest Origin allowlist governs every Manifest URL accepted by the installation UI.
- [ ] A successfully installed Widget Manifest supplies a stable Widget Type, display metadata, version, Widget Element tag, entry bundle URL, default Widget Configuration, and preferred Grid Layout size.
- [ ] Widget Installations and the empty Dashboard Snapshot survive reload independently.
- [ ] User-observable tests cover successful installation and every rejected-installation outcome without relying on remote networks.

