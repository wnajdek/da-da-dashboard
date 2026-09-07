# 01: Standardize TypeScript private members

**What to build:** Make private implementation details read consistently across the Dashboard and Weather Widget code by using the TypeScript `private` keyword for private fields, methods, and accessors, while reserving `protected` for Angular members used by templates.

**Blocked by:** None (can start immediately).

**Status:** completed

- [x] All ECMAScript `#` private members in production and test code are migrated to TypeScript `private` members without changing behavior.
- [x] Angular members referenced only by a template are `protected`; inputs, outputs, and intentional module interfaces remain publicly accessible.
- [x] No new test reaches through a private member to verify implementation details.
- [x] Repository guidance explicitly documents the convention and the full test suite and production builds remain green.
