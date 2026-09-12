# 03: Render Weather through the Angular integration package

**What to build:** A Widget Author can expose Angular content and settings components as the two required Widget Elements without implementing Custom Element lifecycle, registration, or configuration-event plumbing themselves, demonstrated by the unchanged Weather experience.

**Blocked by:** 02: Build Weather from one typed Widget definition.

**Status:** ready-for-agent

- [ ] The Angular integration package creates and reuses the Widget application's Angular environment and exposes both components through the tags in the Widget definition.
- [ ] Configuration assigned before connection, after connection, and after a later Dashboard update reaches the mounted Angular component without recreating it.
- [ ] Disconnecting and reconnecting an Element manages its Angular view safely without losing the latest configuration.
- [ ] Registration rejects either tag collision before partially registering the Widget.
- [ ] The package provides a typed way for a Widget Settings Element to emit a bubbling, complete replacement Widget Configuration.
- [ ] The public Angular interface contains no Dashboard store, installation, routing, persistence, or Grid Layout implementation concerns.
- [ ] Weather uses the package while preserving its loading, data, validation, settings-save, and failure behavior.
- [ ] Focused lifecycle tests, Weather tests, Dashboard integration tests, and production builds pass.

