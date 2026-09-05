# 03: Fetch and present weather inside the Weather Widget

**What to build:** A user-configured Weather Widget independently obtains and presents weather for its own settings. The Widget gives the user understandable states while data is loading, after it succeeds, when its settings are invalid, and when its weather request fails; the Dashboard remains unaware of weather providers and weather data shapes.

**Blocked by:** 02: Render the Weather Widget as an installed Custom Element.

**Status:** completed

- [x] The Weather Widget chooses and calls its own weather-data provider using its persisted Widget Configuration.
- [x] The Widget presents visible loading, successful-data, settings-validation, and fetch-failure states.
- [x] Changing Widget settings updates the Widget's own data request and rendered weather without recreating the Dashboard card.
- [x] Tests prove Widget-observable data behavior with controlled provider responses and do not assert Dashboard store or data-gateway internals.

## Comments

- Implemented Widget-owned Open-Meteo geocoding and current-conditions fetching with response validation, explicit loading/validation/error/success states, stale-request protection, and in-place settings updates. Added controlled provider and Widget-observable tests. Dashboard and Weather Widget production builds pass; Karma browser assertions remain unavailable because ChromeHeadless is not installed in this environment.
