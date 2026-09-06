# 05: Extract long Dashboard templates

**What to build:** Let maintainers read the Dashboard Shell and Dashboard Grid presentation separately from their TypeScript behavior by moving substantial templates into same-named companion HTML files.

**Blocked by:** 04/Organize Dashboard code by feature responsibility.

**Status:** ready-for-agent

- [ ] The substantial Dashboard Shell and Dashboard Grid templates use colocated external HTML files.
- [ ] Small templates remain inline where doing so keeps a complete, readable concept together.
- [ ] Template-only class members use the repository's protected-member convention.
- [ ] Rendering, accessibility attributes, test selectors, and user interactions are unchanged.
- [ ] Component tests and production builds remain green.

