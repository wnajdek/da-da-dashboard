# 02: Render the Weather Widget as an installed Custom Element

**What to build:** A Dashboard user can add an installed Weather Widget to the Dashboard. The separately built Weather Widget application publishes its Widget Manifest and entry bundle; the Dashboard loads that bundle when the Widget Instance renders, creates its declared Widget Element, and persists replacement Widget Configuration emitted by the Widget's own settings UI.

**Blocked by:** 01: Install a trusted Widget Manifest.

**Status:** resolved

- [x] The Weather Widget is independently built and registers exactly the Widget Element declared by its Widget Manifest.
- [x] Adding the installed Weather Widget creates a Widget Instance using the Manifest's default Widget Configuration and preferred Grid Layout size while the Dashboard chooses placement.
- [x] The Dashboard assigns opaque JSON-safe configuration to the Widget Element and persists complete JSON-safe replacement configuration from its bubbling `configuration-changed` event.
- [x] The Weather Widget owns a visible settings UI and validation; the Dashboard contains no weather-specific form or data logic.
- [x] Dashboard-host and Widget-Element contract tests prove the complete install, add, settings-save, and reload path.
