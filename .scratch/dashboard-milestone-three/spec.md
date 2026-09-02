Status: ready-for-agent

# Configurable Dashboard — Milestone Three: Trusted Runtime Widget Applications

## Problem Statement

I want the Dashboard to become an extensible host for Widgets authored as
separate Angular applications. The current built-in KPI, Time-Series, and Notes
Widgets are not an extensibility mechanism: they are compiled into the
Dashboard, the Dashboard knows their configuration shapes, and it supplies
their display data. That makes every new Widget Type a Dashboard source change
and deployment.

I need a trusted Widget Author to publish a Widget independently and a
Dashboard user to install it through the UI by providing its Widget Manifest
URL. The first end-to-end proof is a Weather Widget. It must fetch and present
its own weather data and own its settings UI, while the Dashboard remains
responsible only for Widget Instance persistence and Grid Layout.

## Solution

Deliver a trusted runtime Widget platform based on browser Custom Elements. A
Widget Author builds a separate Angular Widget application, publishes an entry
bundle and Widget Manifest at a Trusted Manifest Origin, and declares one
Widget Element. A Dashboard user supplies the Manifest URL. The Dashboard
accepts it only when its origin is allowlisted, validates the manifest, records
a Widget Installation, and makes the Widget Type available for addition.

When a Widget Instance is rendered, the Dashboard loads the installed entry
bundle and creates the declared Widget Element. The Dashboard passes the
persisted, opaque Widget Configuration through one property. The Widget owns
its settings UI, data fetching, validation, refresh behavior, and presentation;
it emits one configuration-change event containing a complete JSON-safe
replacement configuration. The Dashboard persists that replacement without
interpreting Widget-specific fields.

Build the Weather Widget as the first separate application and use it to prove
manifest installation, runtime loading, Widget-owned weather fetching,
Widget-owned settings, persistence, reload, and failure containment. Retire the
obsolete built-in Widget implementation rather than maintaining two competing
Widget architectures.

## User Stories

1. As a dashboard user, I want to start with an empty Dashboard after the obsolete built-in Widgets are retired, so that I do not confuse old demos with installable Widgets.
2. As a dashboard user, I want to enter a Widget Manifest URL in the Dashboard UI, so that I can install a Widget published by a trusted Widget Author.
3. As a dashboard user, I want the Dashboard to reject a Manifest URL from an origin that is not trusted, so that an ordinary user cannot execute arbitrary third-party code in my Dashboard.
4. As a dashboard user, I want to receive a clear installation error when a Manifest URL cannot be read or is invalid, so that I know why the Widget is not available.
5. As a dashboard user, I want to see the installed Widget's display metadata before adding it, so that I can choose the intended Widget Type.
6. As a dashboard user, I want to add one or more Widget Instances from an installed Widget Type, so that I can place the same capability in several parts of my Dashboard.
7. As a dashboard user, I want a new Widget Instance to use the Widget Manifest's preferred Grid Layout size, so that the Widget Author can express its presentation needs while the Dashboard still chooses placement.
8. As a dashboard user, I want a new Widget Instance to start with the Widget's declared default Widget Configuration, so that it is usable without editing Dashboard-owned forms.
9. As a dashboard user, I want an installed Widget to load only when one of its Widget Instances needs rendering, so that unused Widget code is not loaded eagerly.
10. As a dashboard user, I want an individual Widget card to indicate that it is loading, so that I understand a temporary delay while its entry bundle is obtained.
11. As a dashboard user, I want the Dashboard to render a loaded Widget through its declared Widget Element, so that the Dashboard does not depend on the Widget's Angular component classes.
12. As a dashboard user, I want a Widget to show and edit its own settings, so that a Weather Widget can manage location and units without the Dashboard needing weather-specific forms.
13. As a dashboard user, I want a Widget's saved settings to remain after a Dashboard reload, so that Widget configuration is durable.
14. As a dashboard user, I want a Widget to apply my newly saved settings immediately, so that its visible content responds without recreating the Widget card.
15. As a dashboard user, I want the Weather Widget to fetch its own weather data, so that the Dashboard does not become a weather-data service or need weather-specific knowledge.
16. As a dashboard user, I want the Weather Widget to show understandable loading, successful-data, and fetch-failure states, so that external-data conditions do not make the Dashboard confusing.
17. As a dashboard user, I want to drag, resize, remove, and undo removal of installed Widget Instances, so that existing Dashboard management behavior works independently of Widget Type.
18. As a dashboard user, I want an unavailable Widget to remain in my Dashboard with a safe removal action if its installation is missing, its bundle fails, or it does not register the declared Widget Element, so that one Widget failure does not prevent the rest of the Dashboard from working.
19. As a dashboard user, I want malformed, unsupported, or duplicate persisted Dashboard data to continue using explicit recovery rather than being silently replaced, so that my local data remains under my control.
20. As a Widget Author, I want to build the Weather Widget as a separate Angular application, so that its release cycle and implementation are independent from the Dashboard application.
21. As a Widget Author, I want to publish a Widget Manifest and entry bundle at a Trusted Manifest Origin, so that a Dashboard user can install my Widget without a Dashboard source change or redeployment.
22. As a Widget Author, I want the Widget Manifest to declare the stable Widget Type, display metadata, version, Widget Element tag, entry bundle URL, default Widget Configuration, and preferred Grid Layout size, so that the Dashboard can install and host the Widget without importing its source.
23. As a Widget Author, I want the Dashboard to assign the configuration object to my Widget Element and listen for one documented configuration-change event, so that I have a small, stable interface to implement.
24. As a Widget Author, I want my Widget to choose its own data provider and refresh behavior, so that the Dashboard remains independent of my domain and data model.
25. As a Widget Author, I want my Widget to validate its own settings and show its own validation feedback, so that I can evolve settings without requiring Dashboard updates.
26. As a Dashboard operator, I want to configure Trusted Manifest Origins outside the user installation flow, so that Widget trust is centrally controlled.
27. As a Dashboard operator, I want the Dashboard to treat an allowlisted Widget as trusted code, so that its security model is explicit rather than falsely implying isolation.
28. As a learner, I want to see a real Custom Element boundary between a host Angular app and a separately built Angular Widget app, so that I understand the difference between lazy components and runtime plugins.
29. As a learner, I want the first runtime Widget to be Weather, so that the Widget-owned data-fetching rule is demonstrated by a concrete domain rather than a passive placeholder.
30. As a future Widget Author, I want the same manifest and Widget Element interface to work for a second Widget Type, so that Weather is a proof of a reusable platform rather than a hard-coded exception.

## Implementation Decisions

- This milestone follows the Dashboard glossary and ADR-0001, ADR-0002, and ADR-0009 through ADR-0012. ADR-0003, ADR-0005, and ADR-0008 are superseded for the external-Widget direction.
- A Widget Author publishes a separate Angular Widget application. The Dashboard does not import that application's Angular component type or share a Dashboard-owned Widget Data Gateway with it.
- A Widget Manifest is the declarative installation artifact. It identifies one stable Widget Type and includes display metadata, a compatible version, the declared Widget Element tag, entry bundle URL, default Widget Configuration, and preferred Grid Layout size. It contains no Dashboard Instance identity, position, order, or persisted user configuration.
- The installation UI accepts a Manifest URL only after URL parsing and origin comparison against Dashboard-operator-controlled Trusted Manifest Origins. The allowlist is not user-editable through the installation flow.
- Manifest and entry-bundle URLs are resolved safely from the allowed Manifest origin. Failed fetches, malformed manifests, unsupported manifest versions, duplicate/conflicting Widget Types, and missing or mismatched Widget Element registration are contained as clear installation or unavailable-Widget outcomes.
- A Widget Installation is persisted separately from the Dashboard Snapshot so an installed Widget Type can be rediscovered and added after reload. Removing an installation leaves existing Widget Instances structurally valid but unavailable; it does not silently delete user layout or configuration.
- The Dashboard's runtime-loading Module is the deep module at the extension seam. It hides manifest validation, installation lookup, entry-bundle loading, Custom Element registration checks, and unavailable outcomes behind one host-facing resolution interface.
- The Dashboard renders resolved Widgets as browser Custom Elements, not `NgComponentOutlet` Angular component types. The element tag must be globally valid and uniquely associated with its installed Widget Type in the current browser session.
- The Widget Element interface is deliberately limited to one `configuration` property and one bubbling `configuration-changed` Custom Event. The event detail is a complete replacement Widget Configuration. Both directions carry JSON-safe object values only.
- The Dashboard validates that a configuration-change event contains a JSON-safe object, persists it for the current Widget Instance, and assigns the persisted configuration back to the mounted Widget Element. It does not read, validate, or render Widget-specific fields.
- A Widget Element owns its settings UI, settings validation, data fetching, credentials appropriate to its own browser execution, refresh behavior, and domain presentation. The Weather Widget fetches weather data itself and presents its own loading/error/result states.
- The Dashboard owns Widget Instance ID, ordering, Grid Layout, placement, persistence, selection, removal, and removal undo. Widget Elements receive no Dashboard store access, layout-management interface, generic event bus, data gateway, resize request, refresh request, or dialog request in this milestone.
- New Widget Instances use the installed Widget Manifest's defaults and preferred size. The Dashboard chooses their initial position.
- The existing built-in Widget Registry, built-in Widget components, dashboard-side typed configuration editor, deterministic demo-data mechanism, and their obsolete tests are removed. The seeded Dashboard contains no Widget Instances.
- Existing persisted built-in Widget Instances are preserved as Unavailable Widgets rather than erased. Explicit reset remains the user-controlled way to replace saved Dashboard data with the empty seed Dashboard.
- The Weather Widget is the first vertical slice. A follow-up Widget Type should reuse the same runtime-installation and Custom Element interface before the platform grows new capabilities.

## Testing Decisions

- The primary test seam is the user-visible Dashboard host with memory-backed persistence, a controlled Trusted Manifest Origin, and a test Widget Element. Tests assert installation, available-add flow, Widget rendering, configuration persistence, reload behavior, and unavailable containment—not dynamic script-loader internals or Angular component implementation details.
- The Dashboard host tests cover rejecting non-allowlisted Manifest URLs; successful install; invalid or unsupported manifests; bundle failure; missing or incorrectly registered Widget Elements; removal of an installation; and coexistence of unavailable and working Widget Instances.
- Dashboard behavior tests cover adding Widget Instances with manifest defaults and preferred Grid Layout, retaining drag/resize/remove/undo behavior, and preserving Widget configuration and layout across reloads.
- Widget Element contract tests cover receiving configuration, rendering its own settings UI, emitting a complete JSON-safe `configuration-changed` event after a valid save, and retaining its own visible state when the Dashboard assigns updated configuration.
- Weather Widget tests cover location/settings validation, independently initiated weather fetches, and visible loading, success, and error states. They must not assert Dashboard store calls or any Dashboard data-gateway behavior.
- Focused persistence tests extend the existing Dashboard Snapshot seam. They keep explicit recovery for malformed snapshots while accepting structurally valid opaque Widget Configurations and preserving Unavailable Widgets.
- Focused runtime-module tests cover pure manifest validation, allowed-origin checks, URL resolution, and configuration serializability. They should not rely on actual remote networks.
- Existing GridStack layout-adapter and Dashboard-store tests remain prior art for portable Grid Layout, final-layout persistence, removal undo, and recovery. Replace tests for the retired built-in Widget behavior rather than leaving them to describe obsolete architecture.
- Successful verification includes a production Angular build for the Dashboard, a production build for the Weather Widget application, and the full Karma/Jasmine suite. The known lack of a ChromeHeadless binary in the current environment must be reported if it still prevents browser assertions from running.

## Out of Scope

- Arbitrary or untrusted end-user JavaScript, sandboxed iframes, `postMessage` protocols, and a public Widget marketplace.
- A centrally managed Widget Catalog, catalog-administration interface, author-submission workflow, search, ratings, or Widget discovery beyond entering an allowlisted Manifest URL.
- Dashboard-provided Widget data, a generic Widget Data Gateway, shared data caching, Dashboard-managed authentication, secrets, or backend proxying for Widget data requests.
- Module Federation, Native Federation, a shared Angular runtime between host and Widget applications, and runtime Angular component-type loading.
- Generic Widget-to-host capabilities beyond configuration replacement, including resize requests, refresh requests, dashboard dialogs, host navigation, a generic action bus, or direct Dashboard-store access.
- Widget-provided Dashboard layout controls, Widget Instance reordering, multiple Dashboards, sharing, import/export, multi-user synchronization, server persistence, and routing changes.
- Automatic Widget updates, rollback, integrity-signature infrastructure, background installation checking, and compatibility migrations beyond the declared manifest/runtime validation in this milestone.
- A second independently authored Widget Type; it is the planned proof after the Weather Widget vertical slice succeeds.

## Further Notes

- Trusted Manifest Origin allowlisting is a trust decision, not a sandbox. An approved Widget bundle runs with the Dashboard page's browser privileges; only operators who trust the author should add an origin.
- Custom Elements are the runtime seam because a separately built Widget can expose a browser-standard element interface rather than an Angular component type. Angular Elements is an implementation option for the Widget application; the Dashboard contract remains browser-level.
- The retained unavailable-Widget card is important during migration and runtime failures: a saved Widget Instance must not make the whole Dashboard unusable merely because its Widget Installation cannot currently resolve.
- The Dashboard refactor already removes the old built-in Widget implementation and leaves an empty seeded Dashboard. This spec directs the remainder of Milestone Three from that cleaned host state.
