# 04: Unavailable Widget resilience

**What to build:** A structurally valid persisted Widget Instance that cannot be rendered remains contained in an unavailable-widget card, so users can keep using and editing the rest of their Dashboard and remove only the unavailable instance if they choose.

**Blocked by:** 03: Lazy rendering for registered Widgets.

**Status:** completed

- [x] Dashboard Snapshot validation accepts structurally valid Widget Instances with unavailable Widget Types and preserves their ID, Widget Configuration, order, and Grid Layout.
- [x] A Dashboard with an unavailable Widget and working Widget Instances loads normally; only the unavailable card is substituted, and its removal action works.
- [x] A registered Widget whose lazy implementation loader fails receives the same unavailable-widget card.
- [x] The unavailable-widget card provides safe identification and removal only; it does not add retry, diagnostics, editing, or plugin-management behavior.
- [x] Malformed Widget Instance structure, malformed Grid Layout, duplicate IDs, and unsupported Dashboard Snapshot versions continue to use the explicit recovery behavior.
- [x] Dashboard-shell and persistence tests prove the distinction between unavailable Widget containment and Dashboard Snapshot recovery using observable outcomes.
- [x] The final implementation keeps persistence validation, Widget resolution, and unavailable-card presentation in distinct readable responsibilities; the full test suite and production build pass.

## Comments

- Implemented unavailable Widget containment for unknown persisted types and failed lazy loaders. Unknown configurations remain structurally opaque, while the card uses a safe fallback title when needed.
- Typechecking, formatting, focused test bundles, the full test bundle, and production build pass. Karma browser assertions could not run because ChromeHeadless is unavailable in this environment.
