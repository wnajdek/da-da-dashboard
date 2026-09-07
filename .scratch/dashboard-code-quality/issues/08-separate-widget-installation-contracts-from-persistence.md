# 08: Separate Widget Installation contracts from persistence

**What to build:** Let Widget Installation behavior depend on domain-owned installation contracts instead of importing those concepts from a browser-storage implementation.

**Blocked by:** 07/Centralize Dashboard domain validation.

**Status:** completed

- [x] Widget Installation and its operation-result types have a domain-owned interface independent of persistence.
- [x] Manifest validation produces the canonical Widget Type and owned default Widget Configuration established by the domain decoders.
- [x] Installation persistence exposes only its necessary load/save interface and keeps versioning and storage details inside its implementation.
- [x] Pure installation decoding helpers remain module-private or live in the canonical decoder; they are not turned into stateful methods without a state dependency.
- [x] Installation reload, malformed-snapshot recovery, and independent Dashboard Snapshot behavior remain covered and green.
