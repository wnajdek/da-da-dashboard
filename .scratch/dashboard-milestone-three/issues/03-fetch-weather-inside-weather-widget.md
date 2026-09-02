# 03: Fetch and present weather inside the Weather Widget

**What to build:** A user-configured Weather Widget independently obtains and presents weather for its own settings. The Widget gives the user understandable states while data is loading, after it succeeds, when its settings are invalid, and when its weather request fails; the Dashboard remains unaware of weather providers and weather data shapes.

**Blocked by:** 02: Render the Weather Widget as an installed Custom Element.

**Status:** ready-for-agent

- [ ] The Weather Widget chooses and calls its own weather-data provider using its persisted Widget Configuration.
- [ ] The Widget presents visible loading, successful-data, settings-validation, and fetch-failure states.
- [ ] Changing Widget settings updates the Widget's own data request and rendered weather without recreating the Dashboard card.
- [ ] Tests prove Widget-observable data behavior with controlled provider responses and do not assert Dashboard store or data-gateway internals.

