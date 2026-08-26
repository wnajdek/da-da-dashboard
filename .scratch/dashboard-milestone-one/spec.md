Status: ready-for-agent

# Configurable Dashboard — Milestone One

## Problem Statement

I want an Angular learning project that demonstrates how a configurable dashboard works without adopting the complexity of external widget plugins or micro-frontends. I need to add and remove built-in Widget Instances, arrange them interactively, configure them, and have the Dashboard survive a browser reload using only local storage. The result should make the Angular boundaries—state, dependency injection, typed forms, dynamic rendering, and third-party UI integration—clear and teachable.

## Solution

Deliver one named, locally persisted Dashboard containing built-in KPI, Time-Series, and Notes Widget Instances. On desktop, users arrange Widgets in a Grid Layout through GridStack drag-and-resize interactions. On narrow screens the same persisted desktop Dashboard is presented as a readable single column; mobile does not have an independently editable Layout.

The Dashboard uses deterministic Demo Data selected through stable Data Source keys. A manual refresh advances that data predictably. A side-panel editor configures the selected Widget Instance with typed reactive forms. The Dashboard is persisted as a versioned Dashboard Snapshot, and corrupt or unsupported saved state produces an explicit recovery screen rather than silently overwriting user data.

## User Stories

1. As a dashboard user, I want to open a useful seeded Dashboard on my first visit, so that I can understand the available Widget Types immediately.
2. As a dashboard user, I want the Dashboard to have a visible name, so that the single persisted workspace has clear identity.
3. As a dashboard user, I want to add a KPI Widget Instance, so that I can surface a selected metric.
4. As a dashboard user, I want to add a Time-Series Widget Instance, so that I can view a selected trend.
5. As a dashboard user, I want to add a Notes Widget Instance, so that I can retain local written context beside my data.
6. As a dashboard user, I want every added Widget Instance to receive sensible default configuration and placement, so that it is useful without extra setup.
7. As a dashboard user, I want to select a Widget Instance, so that I can see and edit its configuration in one predictable place.
8. As a dashboard user, I want a side-panel editor appropriate to the selected Widget Type, so that I edit only relevant fields.
9. As a dashboard user, I want to set a Widget title, so that each Widget Instance has understandable local meaning.
10. As a dashboard user, I want KPI and Time-Series Widgets to choose a valid Data Source, so that their displayed data is intentional.
11. As a dashboard user, I want to set the display format for a KPI Widget, so that its value is presented appropriately.
12. As a dashboard user, I want to edit the body of a Notes Widget, so that I can record useful information.
13. As a dashboard user, I want invalid editor input to be explained and blocked from saving, so that no unusable Widget configuration is persisted.
14. As a dashboard user, I want to drag Widgets using a dedicated handle, so that normal interaction with Widget content does not accidentally rearrange the Dashboard.
15. As a dashboard user, I want to resize Widgets within the Grid Layout, so that each Widget has enough visual space.
16. As a dashboard user, I want my final Widget positions and sizes to survive a reload, so that I do not have to recreate my arrangement.
17. As a dashboard user, I want a narrow-screen view to remain readable, so that I can inspect my Dashboard away from a desktop without maintaining a second layout.
18. As a dashboard user, I want to remove a Widget Instance immediately, so that Dashboard cleanup is quick.
19. As a dashboard user, I want a short-lived undo action after removal, so that an accidental deletion restores the exact Widget Instance and Grid Layout.
20. As a dashboard user, I want to manually refresh demo values, so that I can observe data-driven Widget updates without relying on a backend.
21. As a dashboard user, I want Widget data to update predictably, so that changes are understandable while I learn the application.
22. As a dashboard user, I want my Dashboard state saved locally after meaningful changes, so that my work is retained offline in this browser.
23. As a dashboard user, I want an understandable recovery state if saved Dashboard data cannot be read or is from an unsupported version, so that the app does not silently lose my work.
24. As a dashboard user, I want an explicit reset-to-defaults action in the recovery state, so that I retain control over discarding invalid saved data.
25. As a learner, I want Widgets to be dynamically rendered through a known built-in registry, so that I can learn dynamic Angular components without implementing runtime plugins.
26. As a learner, I want third-party Grid and chart libraries confined to presentation boundaries, so that the Dashboard domain remains understandable and replaceable.

## Implementation Decisions

- The application supports exactly one Dashboard in this milestone. It has a stable ID, title, and ordered Widget Instances; Dashboard creation, switching, and navigation are deferred.
- A Widget Instance is a discriminated union with a stable UUID, a portable Grid Layout, and a Widget-Type-specific configuration. Supported Widget Types are `kpi`, `time-series`, and `notes`.
- A KPI configuration contains a title, a metric Data Source key, and a display format. A Time-Series configuration contains a title and a series Data Source key. A Notes configuration contains a title and body. Only valid keys from the Demo Data catalog are accepted.
- Grid Layout is a portable `{ x, y, w, h }` value owned by the Dashboard domain. GridStack input/output objects are translated in a shell adapter and must not appear in storage, Widget configuration, or the Dashboard store public contract.
- GridStack provides desktop drag, resize, collision, and placement behavior. Persist layout only after a completed interaction, not for every intermediate drag event. Widget content is not a drag surface; use a dedicated drag handle.
- A small-screen presentation transforms the desktop Grid Layout into a single readable column without altering the stored desktop Layout or offering mobile layout editing.
- Dashboard application state lives in an injected `DashboardStore`: private writable signals hold state, public read-only signals and computed values expose it, and named command methods perform changes. Do not introduce NgRx for this milestone.
- Store commands cover adding default instances, selecting and updating configuration, committing a Grid Layout change, removing, undoing removal, manual Demo Data refresh, reset, and loading/saving state.
- The removal command retains one exact removed Widget Instance and its prior position for a short-lived undo action. A successful undo restores the same ID, configuration, and Grid Layout.
- Demo Data is resolved by an injected service from persisted Data Source keys. It is deterministic and local. Manual refresh advances the seeded values and emits updated data; no HTTP API is introduced.
- A typed built-in widget registry maps every Widget Type to one standalone Angular component. The Dashboard shell renders the selected entry with `NgComponentOutlet` and a common read-only Widget context. GridStack must not become the component factory for application widgets.
- The side-panel editor is implemented using typed reactive forms. It selects the appropriate form for the selected Widget Type; titles and Data Source selections are required, safe display limits apply, inline validation is visible, and invalid forms cannot save.
- The Time-Series Widget uses Apache ECharts through `ngx-echarts` pinned to the Angular 20-compatible `20.0.1` release. Register only the needed ECharts modules. The Widget maps resolved series data into chart options; ECharts options and types are presentation details, not domain state.
- Local persistence is a `DashboardSnapshotV1` envelope containing a schema version and Dashboard payload. On first load, absent storage receives the seed Dashboard. Malformed, structurally invalid, or unsupported-version snapshots produce a visible recovery state and are not replaced until the user explicitly resets.
- Storage, Demo Data, GridStack adaptation, and Dashboard state remain separate injected services/adapters so Angular components focus on observable UI behavior.
- Use standalone components, explicit imports, signals, `@for` with Widget Instance IDs, and the existing zoneless application configuration. The feature does not add routing requirements.
- Add domain documentation as the feature is implemented: a glossary for Dashboard, Widget Instance, Widget Type, Widget Configuration, Grid Layout, Data Source, and Dashboard Snapshot; and ADRs covering signal-backed state, portable layout behind GridStack, versioned explicit-recovery persistence, and the built-in registry boundary.

## Testing Decisions

- The primary test seam is the Dashboard shell as a user-facing system: load or recovery state, adding, selecting/editing, arranging, removing/undoing, refreshing, saving, and loading persisted Dashboard state. Tests should assert user-observable output and outcomes rather than signal internals, component implementation details, or third-party library calls.
- Component tests cover each Widget’s visible content and its editor’s validation behavior. They should prove an edited configuration appears in the rendered Widget and invalid input cannot be saved.
- Dashboard interaction tests cover default Widget creation, dynamic rendering for each known Widget Type, side-panel selection, configuration updates, remove/undo restoration, manual refresh, and desktop-to-narrow-screen behavior.
- Focused service tests cover Snapshot validation/version handling, explicit recovery and reset behavior, storage write failure reporting, deterministic Demo Data refresh, and Dashboard-store command outcomes.
- Focused adapter tests cover conversion between portable Grid Layout and GridStack objects, including preserving Widget Instance IDs and committing only final layout changes.
- The existing codebase contains only the Angular starter component test and Karma/Jasmine runner; establish this feature’s behavior-oriented component-test patterns with Angular TestBed and retain the project’s test runner.
- A successful feature verification includes the full Karma suite and production Angular build.

## Out of Scope

- Runtime external Widget plugins, plugin manifests, external Widget loading, module federation, and micro-frontends.
- Backend persistence, authentication, multi-user editing, synchronization, API fetching, polling, and real-time streams.
- Multiple Dashboards, Dashboard CRUD, Dashboard switching, routing, sharing, import/export, and server-side layout migration.
- Independently configurable mobile Layouts.
- Additional Widget Types such as tables, gauges, maps, or alerts.
- Automatic/timed Demo Data refresh.
- A generic migration framework beyond rejecting non-v1 Dashboard Snapshots.
- Comprehensive ECharts functionality beyond the Time-Series Widget’s required rendering.

## Further Notes

- Seed the Dashboard as “My dashboard” with one KPI, one Time-Series, and one Notes Widget Instance.
- This milestone intentionally creates an extension seam for future built-in Widget Types, not a public plugin API. Adding a future type requires a new discriminated configuration, editor, renderer, registry entry, and default placement.
- The implementation should favor clear Angular learning boundaries over prematurely general framework abstractions.
