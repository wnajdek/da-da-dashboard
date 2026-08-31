Status: ready-for-agent

# Configurable Dashboard — Milestone Two: Lazy Built-in Widget Registry

## Problem Statement

I have a configurable Angular Dashboard with built-in KPI, Time-Series, and
Notes Widget Instances dynamically rendered through an eager component map. I
want to learn how a Dashboard can resolve a Widget Type through a proper Widget
Registry and load its built-in Angular implementation lazily, without turning
this milestone into a runtime plugin or micro-frontend system.

The Dashboard must retain its existing domain ownership: it persists Widget
Instances, not Angular component classes, import paths, or bundle URLs. A
single unavailable Widget must not prevent a user from seeing or using the rest
of the Dashboard. The result should make a clean host/widget contract visible
while staying inside one trusted Angular application build.

## Solution

Deliver a startup-composed, immutable Widget Registry for the built-in Widget
Types. Each Widget Definition provides Widget-Type-specific metadata, creation
defaults, preferred Grid Layout size, and a lazy loader for its Angular
implementation. When a Dashboard card renders, the host resolves its Widget
Type, begins loading its implementation, shows a small card-level loading state,
then dynamically renders the resolved implementation.

The Dashboard host passes a Widget its typed Widget Configuration as a reactive
input. The Widget obtains display data from a narrow injected Widget Data
Gateway rather than from the Dashboard store or host-provided resolved data.
Dashboard management controls, including editing and removal, remain outside
Widget implementations.

Preserve structurally valid unavailable Widget Instances and render a minimal
unavailable-widget card with a removal action. This applies both to an
unregistered persisted Widget Type and to a lazy implementation loader failure.
Malformed, structurally invalid, or unsupported Dashboard Snapshots retain the
existing explicit recovery behavior.

## User Stories

1. As a dashboard user, I want the Dashboard to load Widget implementations only when their cards render, so that initial application code does not need to contain every Widget implementation.
2. As a dashboard user, I want each visible Widget card to show a small loading state while its implementation is being obtained, so that temporary blank content is not confusing.
3. As a dashboard user, I want a resolved KPI Widget Instance to render normally, so that existing metric use remains intact after lazy loading is introduced.
4. As a dashboard user, I want a resolved Time-Series Widget Instance to render normally, so that existing chart use remains intact after lazy loading is introduced.
5. As a dashboard user, I want a resolved Notes Widget Instance to render normally, so that existing local written context remains intact after lazy loading is introduced.
6. As a dashboard user, I want to add another instance of any currently registered Widget Type, so that I can use multiple instances of the same built-in capability.
7. As a dashboard user, I want a new Widget Instance to receive Widget-Type-specific default configuration, so that it is useful immediately after adding it.
8. As a dashboard user, I want a new Widget Instance to receive its Widget Type's preferred Grid Layout size and a host-chosen position, so that the Dashboard controls placement while Widgets express their space needs.
9. As a dashboard user, I want configured Widget content to update after saving its configuration, so that I can see my changes without recreating the card or reloading the Dashboard.
10. As a dashboard user, I want a Widget's local UI state to remain intact when its configuration changes, so that ordinary edits do not unnecessarily reset the Widget.
11. As a dashboard user, I want Widget data to refresh predictably after using the Dashboard refresh action, so that Widgets continue to react to the deterministic Demo Data catalog.
12. As a dashboard user, I want a Widget that cannot be resolved to be shown as unavailable instead of breaking the entire Dashboard, so that I can continue using my other Widget Instances.
13. As a dashboard user, I want an unavailable Widget Instance to retain its position and place in Dashboard order, so that unavailable content does not rearrange my Dashboard.
14. As a dashboard user, I want an unavailable Widget card to offer removal, so that I can clean up a Widget Type this application version cannot display.
15. As a dashboard user, I want a known Widget whose implementation chunk fails to load to show the same unavailable card, so that a loading failure is contained to that Widget Instance.
16. As a dashboard user, I want malformed or unsupported saved Dashboard data to keep using the explicit recovery screen, so that graceful Widget unavailability does not hide corrupted persistence.
17. As a dashboard user, I want existing edit and remove controls to remain Dashboard controls rather than becoming Widget content, so that Dashboard management remains predictable.
18. As a learner, I want Widget implementation code to be loaded through standard Angular and JavaScript lazy-loading mechanisms, so that I can understand dynamic Angular rendering without external plugin infrastructure.
19. As a learner, I want the Dashboard domain to remain unaware of Angular component classes and module paths, so that persistence and Dashboard state stay portable.
20. As a learner, I want Widget implementations to receive only their typed configuration and a narrow data-access capability, so that they do not depend on Dashboard internals.
21. As a learner, I want the currently registered Widget Types to be fixed for a running application session, so that lazy loading is not confused with runtime plugin installation.
22. As a developer, I want to add a future built-in Widget Type by changing source, registering its definition, building, and deploying the application, so that the extension path remains straightforward without user-uploaded code.
23. As a developer, I want Widget defaults and display metadata to have one authoritative definition, so that adding Widget Types does not duplicate defaults across the Dashboard store and shell.
24. As a developer, I want an explicit distinction between registered Widget Types and unavailable persisted Widget Types, so that snapshot validation and rendering have clear responsibilities.
25. As a developer, I want the configuration editor to remain host-side for now, so that lazy implementation loading can be learned without also designing a dynamic form-plugin contract.

## Implementation Decisions

- The feature follows ADR-0001 through ADR-0008 and the Dashboard glossary vocabulary. In particular, a Widget Instance, Widget Type, Widget Definition, Widget Registry, Widget Data Gateway, and Unavailable Widget retain their documented meanings.
- The Widget Registry is composed declaratively during Angular application startup and is immutable for the browser session. It has no runtime registration or removal API.
- A Widget Definition is the authoritative source for a registered Widget Type's display name, default Widget Configuration, preferred Grid Layout width and height, and lazy implementation loader. It does not own Widget Instance ID, placement coordinates, order, persistence, selection, or removal.
- A lazy loader resolves only the standalone Angular implementation component. It does not return another Widget Definition, self-register a chunk, or negotiate a runtime manifest.
- The Dashboard store creates the Widget Instance ID and chooses its placement using the definition's preferred size. It no longer duplicates Widget-Type-specific default configuration or universal default dimensions.
- Widget implementation imports must be removed from eager Dashboard rendering paths so their code can be emitted outside the initial application bundle. Loading starts when each Dashboard card renders; viewport-triggered deferral is not introduced.
- The host maintains a card-level resolution state with loading, resolved, and unavailable outcomes. A resolver miss and a rejected lazy loader both produce the unavailable outcome.
- The implementation continues using declarative dynamic rendering through `NgComponentOutlet`. It accepts the asynchronously resolved component type and a changing input object; the lower-level component creation APIs are not required for the agreed scope.
- A resolved Widget receives only its Widget-Type-specific Widget Configuration through a required signal input. Ordinary configuration updates update that input on the mounted implementation rather than recreating the component.
- Widget implementations obtain display data from an injected, narrow Widget Data Gateway. The gateway replaces direct dependency on a Dashboard-wide service as the deliberate platform boundary, while retaining deterministic local Demo Data and manual refresh behavior.
- Widget implementations must not inject the Dashboard store or receive full Widget Instances, Grid Layout, or Dashboard-management APIs. No generic widget action bus, output contract, child injector, or Widget Context is added without a concrete Widget behavior that needs it.
- Edit and removal controls remain Dashboard-host UI. The existing typed reactive-form configuration editor and its validation remain host-side; loading Widget-provided configuration forms is deferred.
- Persistence validation must preserve a structurally valid Widget Instance with an unavailable Widget Type and opaque Widget Configuration. It must continue rejecting malformed Widget Instance structure, duplicate IDs, malformed layouts, and unsupported Dashboard Snapshot versions. Registered Widget Types retain their known configuration validation.
- An unavailable-widget card preserves the Widget Instance's ID, raw configuration, order, and Grid Layout. It shows a safe label or title when readable and offers removal only. It does not retry loading, expose diagnostics, or allow editing.
- The Dashboard remains a single Angular application/build with trusted built-in source code. The implementation establishes an architectural seam for later discussion, not an external-plugin protocol.

## Testing Decisions

- The primary feature test seam is the Dashboard shell with the real Widget Registry and memory-backed Dashboard persistence. Tests assert user-observable DOM states and outcomes rather than registry implementation details, `ComponentRef` mechanics, signals, or dynamic-import implementation details.
- Dashboard-shell behavior tests cover card-level loading and successful rendering of each registered Widget Type, adding an additional Widget Instance with definition defaults and preferred size, configuration changes becoming visible in an already-rendered Widget, and Demo Data refresh reaching Widgets through the Widget Data Gateway.
- Dashboard-shell behavior tests cover an unavailable persisted Widget alongside working Widget Instances, preservation of its card position/order, safe removal, and a lazy-loader failure contained to one unavailable card.
- Persistence tests extend the existing Dashboard persistence seam. They distinguish malformed or unsupported Dashboard Snapshots, which enter explicit recovery, from structurally valid unavailable Widget Instances, which remain loadable and persistable.
- Focused Widget tests cover rendering from typed configuration and data-gateway updates. They should not assert access to Dashboard store internals, layout data, or registry implementation details.
- Existing Dashboard store, persistence service, Demo Data service, GridStack adapter, and Dashboard shell tests are prior art and should be extended rather than replaced. Existing behavior unrelated to lazy resolution, including layout commits, undo, recovery, and narrow-screen presentation, must remain covered by their current seams.
- Successful verification includes the full Karma/Jasmine suite and a production Angular build. The build output should be inspected to confirm Widget implementation chunks are absent from the initial bundle; do not treat a passed build as proof that GridStack's separate initial-bundle contribution has changed.

## Out of Scope

- External Widget bundles, runtime URLs, user-uploaded or installed Widgets, third-party code, plugin manifests, plugin registries, or runtime Widget registration.
- Module Federation, Native Federation, micro-frontends, Angular Elements, Web Components as an external boundary, iframes, and sandboxing.
- Backend data APIs, authentication, authorization, server-side Widget registries, real-time data, and remote Widget configuration.
- Viewport-based Widget loading, retry workflows, unavailable-Widget diagnostics, and unavailable-Widget editing.
- A generic widget-to-host event bus, host action API, arbitrary child or environment injector configuration, or access to DashboardStore from Widgets.
- Dynamically loaded Widget configuration forms and a generic configuration-editor plugin contract.
- Multiple Dashboards, routing, Dashboard sharing, import/export, or changes to the existing single-Dashboard product scope.
- A promise that this work alone removes the initial-bundle budget warning; GridStack remains outside this Widget implementation lazy-loading decision.

## Further Notes

- This milestone deliberately separates lazy built-in implementation loading from external plugin architecture. A future plugin design may need a richer manifest, compatibility/versioning rules, security/trust decisions, and a different data/platform contract.
- `NgComponentOutlet` remains appropriate because this feature needs declarative inline rendering and reactive inputs, not imperative component reference ownership. `ViewContainerRef.createComponent()` and standalone `createComponent()` remain valuable learning topics for their respective insertion and lifecycle use cases, but are not adopted merely for being lower-level APIs.
- The current persistence implementation rejects all unknown Widget Types. Updating that behavior is a required compatibility change, not an optional resilience enhancement.
