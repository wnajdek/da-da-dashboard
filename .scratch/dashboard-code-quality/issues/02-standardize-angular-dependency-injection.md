# 02: Standardize Angular dependency injection

**What to build:** Give maintainers one predictable way to find and understand the dependencies of each Angular class by consistently using Angular's field-based injection style without changing any injectable interface or runtime behavior.

**Blocked by:** 01/Standardize TypeScript private members.

**Status:** completed

- [x] Angular dependencies use one consistent field-based injection style throughout the Dashboard.
- [x] Injected dependencies that are not part of a class interface are private and readonly.
- [x] Constructors remain only where they perform meaningful initialization rather than dependency declaration.
- [x] Existing test adapters and injection-token overrides continue to work, and the full test suite and production builds remain green.
