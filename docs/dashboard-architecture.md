# Dashboard Architecture

This document explains the main architectural concepts in the Dashboard, what
data is stored, where it is stored, and how that data moves through the
application.

## The central idea: separate availability from placement

The Dashboard distinguishes between a Widget Type that is available to use and
a Widget Instance that has actually been placed on a Dashboard.

```text
Widget Manifest URL
        │ fetch and validate
        ▼
Widget Installation
        │ makes a Widget Type available
        ▼
Widget Instance
        │ has identity, configuration, and layout
        ▼
Dashboard Snapshot
```

This separation gives each part of the system a clear owner:

- The Dashboard owns Widget Instance identity, grid placement, persistence,
  and removal.
- A Widget Author owns a Widget's UI, data fetching, domain-specific settings,
  and presentation.
- The Dashboard passes Widget Configuration to the Widget but does not
  interpret its domain-specific fields.
- The browser's local storage contains user state, not executable Widget code.

## Important domain concepts

### Dashboard

The one named workspace supported by this milestone. It has an ID, a title, and
an ordered collection of Widget Instances.

```ts
{
  id: "e25b6b77-2b4e-4d7e-91df-51feded26e83",
  title: "My dashboard",
  widgets: []
}
```

### Widget Type

A stable identifier for a kind of widget, such as `weather` or `stocks`. It is
not a particular placed widget. Several Widget Instances can use the same
Widget Type.

### Widget Manifest

A manifest describes how a separately built Widget can be used by the
Dashboard. For example, a Widget Author might publish:

```text
https://widgets.example.test/weather/manifest.json
```

The manifest at that URL could contain:

```json
{
  "manifestVersion": 1,
  "type": "weather",
  "displayName": "Weather",
  "description": "Current conditions",
  "version": "1.0.0",
  "elementTag": "weather-widget",
  "entryBundleUrl": "./weather-widget.js",
  "defaultConfiguration": {
    "city": "Warsaw",
    "units": "metric"
  },
  "preferredLayout": {
    "w": 4,
    "h": 3
  }
}
```

The manifest supplies metadata, a Custom Element tag, an entry bundle URL,
default configuration, and a preferred size. It does not contain a Dashboard
instance ID or a user's placement.

### Widget Installation

An installation means that a validated Widget Manifest has been accepted and
the Widget Type is available in this Dashboard session. It is the manifest plus
the normalized URL from which the manifest was loaded.

An installation is not automatically a placed Widget Instance. Availability and
placement are intentionally separate.

### Widget Instance

A Widget Instance is one particular occurrence of a Widget Type on the
Dashboard:

```json
{
  "id": "4d6f4f7b-5d95-4f5e-bc64-7f2adf5b2a21",
  "type": "weather",
  "layout": {
    "x": 0,
    "y": 0,
    "w": 4,
    "h": 3
  },
  "configuration": {
    "city": "Warsaw",
    "units": "metric"
  }
}
```

The Dashboard owns the instance ID and layout. The `configuration` object is
opaque to the Dashboard apart from being required to contain JSON-safe data.

### Widget Element

The loaded Widget implementation is a browser Custom Element, for example:

```html
<weather-widget></weather-widget>
```

Version one of the host-to-widget interface is deliberately small:

1. The Dashboard assigns a JSON-safe `configuration` property.
2. The Widget Element emits a bubbling `configuration-changed` Custom Event
   with a complete replacement configuration.

The Widget Element owns its settings UI and domain data fetching. It does not
receive the entire Dashboard or access the Dashboard store.

## What is stored and where

The application uses two independent `localStorage` entries.

### Dashboard snapshot

Storage key:

```text
configurable-dashboard.snapshot
```

Stored shape:

```json
{
  "schemaVersion": 1,
  "dashboard": {
    "id": "e25b6b77-2b4e-4d7e-91df-51feded26e83",
    "title": "My dashboard",
    "widgets": [
      {
        "id": "4d6f4f7b-5d95-4f5e-bc64-7f2adf5b2a21",
        "type": "weather",
        "layout": {
          "x": 0,
          "y": 0,
          "w": 4,
          "h": 3
        },
        "configuration": {
          "city": "Warsaw",
          "units": "metric"
        }
      }
    ]
  }
}
```

This snapshot stores:

- Dashboard identity and title
- Widget Instance IDs
- Widget Types
- Grid layouts
- Widget Configurations

It does not store Widget JavaScript bundles.

### Widget installation catalog

Storage key:

```text
configurable-dashboard.widget-installations
```

Stored shape:

```json
{
  "schemaVersion": 1,
  "installations": [
    {
      "manifestUrl": "https://widgets.example.test/weather/manifest.json",
      "manifestVersion": 1,
      "type": "weather",
      "displayName": "Weather",
      "description": "Current conditions",
      "version": "1.0.0",
      "elementTag": "weather-widget",
      "entryBundleUrl": "https://widgets.example.test/weather/weather-widget.js",
      "defaultConfiguration": {
        "city": "Warsaw",
        "units": "metric"
      },
      "preferredLayout": {
        "w": 4,
        "h": 3
      }
    }
  ]
}
```

This catalog stores which Widget Types are available, together with their
metadata and loading information. It does not store where each Widget Instance
is placed.

Keeping these entries separate means that a problem with the installation
catalog does not automatically erase the user's Dashboard, and a Dashboard can
retain an instance even when its implementation is temporarily unavailable.

## Application flows

### Application startup

```text
App starts
  │
  ├─ Dashboard store loads the Dashboard snapshot
  │    ├─ valid snapshot → expose Dashboard state
  │    ├─ no snapshot → create and save the seed Dashboard
  │    └─ invalid snapshot → enter explicit recovery mode
  │
  └─ Widget runtime loads the installation catalog
       ├─ valid catalog → expose available Widget Types
       ├─ no catalog → expose an empty catalog
       └─ invalid catalog → show installation error independently
```

The Dashboard and the installation catalog are loaded independently. A failure
in one should not silently replace or destroy the other.

### Loading a Dashboard snapshot

1. Read `configurable-dashboard.snapshot` from `localStorage`.
2. Parse the stored JSON.
3. Check that `schemaVersion` is supported.
4. Validate the Dashboard shape.
5. Validate every Widget Instance, including its layout and JSON-safe
   configuration.
6. Expose the Dashboard only after all validation succeeds.

Malformed, structurally invalid, and unsupported snapshots are not overwritten
automatically. The user must explicitly choose **Reset to defaults** before the
stored value is replaced.

### Installing a Widget

```text
User enters Manifest URL
        │
        ▼
Normalize and validate the URL
        │
        ▼
Check the URL's origin against the trusted-origin allowlist
        │
        ▼
Fetch the manifest JSON
        │
        ▼
Validate its version, fields, configuration, tag, layout, and bundle URL
        │
        ▼
Reject duplicate URLs, Widget Types, and Custom Element tags
        │
        ▼
Save the installation catalog
        │
        ▼
Expose the new Widget Type in the available-widget catalog
```

The allowlist is operator configuration. The current configuration provides an
empty list, so installation fails closed until trusted origins are configured.

The trust boundary is important: approved Widget bundles execute in the same
browser page as the Dashboard. They are trusted code, not sandboxed code. An
untrusted marketplace would require a different iframe and message-based
architecture.

### Changing layout

```text
Dashboard state
      │ convert to GridStack input
      ▼
GridStack drag or resize interaction
      │ convert final nodes to portable layout changes
      ▼
Dashboard store
      │ save only after persistence succeeds
      ▼
Dashboard snapshot
```

The Dashboard model uses the portable `{ x, y, w, h }` layout shape. GridStack's
own node types remain behind an adapter so the domain model is not coupled to a
presentation library.

### Changing Widget Configuration

The intended flow is:

```text
Widget Element settings UI
        │ emits complete replacement configuration
        ▼
Dashboard validates that it is JSON-safe
        │
        ▼
Dashboard persists it for the current Widget Instance
        │
        ▼
Dashboard assigns the persisted configuration back to the element
```

The Dashboard does not know whether a Widget's fields mean `city`, `currency`,
`units`, or something else. Widget-specific validation belongs to the Widget
Author.

### Unavailable Widgets

A structurally valid Widget Instance can remain in the Dashboard even when its
implementation cannot be resolved. This can happen when:

- Its Widget Type is no longer installed.
- Its entry bundle fails to load.
- The bundle does not register the declared Custom Element.

Only that Widget Instance is replaced by an unavailable-widget card. The rest of
the Dashboard remains usable, and the user gets a safe removal path.

## JSON-safe configuration

JavaScript objects can contain Dates, functions, class instances, `undefined`,
`BigInt`, symbols, and special numeric values. Those values are not portable
JSON data.

The Dashboard's `JsonValue` type and runtime checks restrict Widget
Configuration to:

- `null`
- booleans
- finite numbers
- strings
- arrays of JSON values
- plain objects containing JSON values

This gives the Dashboard a durable storage and communication boundary without
requiring it to understand every Widget Type's domain model.

## File map

| File                                                                                                            | Responsibility                                                                                                      |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [`dashboard.models.ts`](../src/app/dashboard/dashboard.models.ts)                                               | Core Dashboard, Widget Instance, layout, configuration types, and shared runtime guards                             |
| [`dashboard.seed.ts`](../src/app/dashboard/dashboard.seed.ts)                                                   | Creates the initial empty Dashboard                                                                                 |
| [`dashboard.store.ts`](../src/app/dashboard/dashboard.store.ts)                                                 | Owns live Dashboard state and Dashboard mutations                                                                   |
| [`dashboard-persistence.service.ts`](../src/app/dashboard/dashboard-persistence.service.ts)                     | Loads, validates, and saves Dashboard snapshots                                                                     |
| [`dashboard-shell.component.ts`](../src/app/dashboard/dashboard-shell.component.ts)                             | Main Dashboard page and installation controls                                                                       |
| [`dashboard-grid.component.ts`](../src/app/dashboard/dashboard-grid.component.ts)                               | Renders the grid and connects it to GridStack                                                                       |
| [`gridstack-layout.adapter.ts`](../src/app/dashboard/gridstack-layout.adapter.ts)                               | Translates between Dashboard layouts and GridStack layouts                                                          |
| [`widget-element.component.ts`](../src/app/dashboard/widget-element.component.ts)                               | Loads a trusted entry bundle, mounts its declared Custom Element, and forwards configuration changes                |
| [`json-value.ts`](../src/app/dashboard/json-value.ts)                                                           | Defines and validates JSON-safe values                                                                              |
| [`widget-manifest.ts`](../src/app/dashboard/widget-manifest.ts)                                                 | Validates and normalizes Widget Manifests                                                                           |
| [`widget-runtime.service.ts`](../src/app/dashboard/widget-runtime.service.ts)                                   | Applies trust checks, fetches manifests, and manages installations                                                  |
| [`widget-installation-persistence.service.ts`](../src/app/dashboard/widget-installation-persistence.service.ts) | Loads and saves the installation catalog                                                                            |
| [`unavailable-widget-card.component.ts`](../src/app/dashboard/unavailable-widget-card.component.ts)             | Safe fallback for unresolved Widget Instances                                                                       |
| [`widget-card.scss`](../src/app/dashboard/widget-card.scss)                                                     | Widget-card styling                                                                                                 |
| `*.spec.ts`                                                                                                     | Tests persistence, validation, recovery, layout translation, installation, runtime loading, and continuity behavior |

### Widget application files

The Weather Widget is the reference separately built application. Its source is
kept under `projects/weather-widget`, but it is not imported as an Angular
component by the Dashboard at runtime.

| File                                                                                                                    | Responsibility                                                                     |
| ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [`projects/weather-widget/src/main.ts`](../projects/weather-widget/src/main.ts)                                         | Creates the Widget application and registers `trusted-weather-widget`              |
| [`projects/weather-widget/src/weather-widget-element.ts`](../projects/weather-widget/src/weather-widget-element.ts)     | Implements the browser Custom Element boundary around the Angular Widget component |
| [`projects/weather-widget/src/weather-widget.component.ts`](../projects/weather-widget/src/weather-widget.component.ts) | Owns Weather settings, validation, states, and presentation                        |
| [`projects/weather-widget/src/weather-data.service.ts`](../projects/weather-widget/src/weather-data.service.ts)         | Fetches and validates geocoding and current-weather responses                      |
| [`projects/weather-widget/public/widget-manifest.json`](../projects/weather-widget/public/widget-manifest.json)         | Publishes the installable Widget metadata and bundle entry point                   |

## Current implementation status

Milestone Three is implemented as a complete trusted runtime Widget vertical
slice. The Dashboard can install a validated Manifest, add one or more Widget
Instances, load the entry bundle on demand, render the declared Custom Element,
persist opaque configuration and portable layout, remove and undo instance
removal, and contain an unavailable Widget without taking down the rest of the
Dashboard.

The Weather Widget is a separate Angular application. It owns its Open-Meteo
requests, settings form, validation, loading state, success state, and error
state. The Dashboard does not import its component class into the host
application or provide a weather data gateway.

The older ADRs describing a static built-in Angular Widget Registry are
transitional history. ADR-0009 and the later ADRs define the current external
Widget direction.

## A complete real-world flow: Weather

The following is the end-to-end path for the reference Weather Widget. It is
useful when changing either application because it shows which side owns each
decision.

```text
Widget Author                 Dashboard Operator              Dashboard User
     │                              │                               │
     │ build and publish             │ allowlist the origin          │
     │ manifest.json + main.js      │ in app.config.ts               │
     └───────────────► Trusted Manifest Origin ◄────────────────────┘
                                    │                               │
                                    │                         enter Manifest URL
                                    │                               │
                                    │                         install + validate
                                    │                               │
                                    │                    installation catalog
                                    │                               │
                                    │                         Add Widget
                                    │                               │
                                    │                   Dashboard Snapshot
                                    │                               │
                                    │                   load bundle on render
                                    │                               │
                                    │              <trusted-weather-widget>
                                    │                               │
                                    │                 save settings in Widget
                                    │                               │
                                    │              configuration-changed event
                                    │                               │
                                    │                   persist and reassign
```

1. The Widget Author builds `projects/weather-widget`. The production build
   produces the Widget entry bundle and copies
   `public/widget-manifest.json` beside it.
2. The Author publishes both files from one HTTPS origin. The manifest uses a
   relative `entryBundleUrl`, so the Dashboard resolves it against the
   manifest URL.
3. The Dashboard operator adds that exact origin to
   `provideTrustedManifestOrigins` in [`app.config.ts`](../src/app/app.config.ts).
   The application currently uses an empty list by default, which fails closed.
4. The user enters the manifest URL. The runtime module normalizes the URL,
   checks its origin before fetching, validates the manifest, and saves a
   Widget Installation in the installation catalog. The Dashboard Snapshot is
   unchanged at this point.
5. The user selects **Add Widget**. The Dashboard creates a new Widget Instance
   with a new ID, the manifest's default configuration, and its preferred size.
   Its initial `x` position is `0`; its `y` position is below the current
   Dashboard content. Placement is still a Dashboard decision.
6. When the card renders, the runtime module loads `main.js` once and verifies
   that the bundle registered `trusted-weather-widget`. The host creates the
   element by tag; it never imports `WeatherWidgetComponent`.
7. The host assigns the saved configuration. The Weather Widget validates the
   location and units, geocodes the location, requests current conditions from
   Open-Meteo, and renders loading, success, validation, or error feedback.
8. When the user saves a valid location, the Widget emits one bubbling
   `configuration-changed` event containing the complete replacement object.
   The Dashboard validates only JSON safety, persists it for that instance, and
   assigns the persisted value back to the element.
9. On a later reload, the two stores are reconstructed independently. The
   installation tells the runtime how to load the element, while the instance
   snapshot supplies its saved configuration and layout. No executable bundle
   is read from local storage.

This flow is deliberately asymmetric: the Dashboard knows how to host a
Widget, but the Weather Widget knows what weather means.

## How to create a new Widget

The Weather application is the template for a future Widget Author. A second
Widget Type should follow these steps without adding a Dashboard-specific
branch.

### 1. Create a separate application target

Add a project under `projects/<widget-name>` with its own entrypoint and
production build target in [`angular.json`](../angular.json). Keep the Widget
application separate from `src/app/dashboard`. The Dashboard may share the
browser-level manifest and element contract, but it must not import the
Widget's Angular component or data service.

The important build boundary is:

```text
src/app/dashboard/                 host application
projects/weather-widget/src/       separately built Widget application
projects/stock-widget/src/         another separately built Widget application
```

The source location alone does not make a Widget available to the Dashboard.
The built manifest and bundle must also be published from a trusted origin and
installed by URL.

### 2. Implement the Widget component

The component owns its domain concerns:

- interpret and validate its configuration;
- render its settings form and validation messages;
- choose its data provider and request/refresh policy;
- render loading, success, empty, and failure states;
- react to a new configuration without requiring the host card to be
  recreated.

For Weather, these responsibilities live in
[`weather-widget.component.ts`](../projects/weather-widget/src/weather-widget.component.ts)
and [`weather-data.service.ts`](../projects/weather-widget/src/weather-data.service.ts).
The Dashboard must not grow a Weather form, a Weather API client, or a
Weather-specific configuration type.

### 3. Expose one browser Custom Element

Wrap the Angular component in a Custom Element factory. The factory is the
runtime boundary; it is not an Angular component registry. A minimal element
implementation has the following shape:

```ts
class ExampleWidgetElement extends HTMLElement {
  #configuration: unknown;

  get configuration(): unknown {
    return this.#configuration;
  }

  set configuration(value: unknown) {
    this.#configuration = value;
    // If the Angular component is mounted, update its input in place.
  }

  connectedCallback(): void {
    // Create or attach the Widget component and apply the saved configuration.
  }

  disconnectedCallback(): void {
    // Detach the Angular view without assuming the host owns Widget state.
  }
}
```

The real Weather implementation is
[`weather-widget-element.ts`](../projects/weather-widget/src/weather-widget-element.ts).
It uses `createComponent` with the Widget application's own
`ApplicationRef`, attaches the view when connected, and forwards later
configuration assignments to the component input.

The element must implement the version-one contract:

```ts
interface WidgetElement extends HTMLElement {
  configuration: JsonObject;
}

element.configuration = savedConfiguration;

element.dispatchEvent(
  new CustomEvent("configuration-changed", {
    bubbles: true,
    detail: completeReplacementConfiguration,
  }),
);
```

The event detail is a complete replacement, not a patch. The Widget should
dispatch it only after its own validation succeeds. The event must bubble so
the host adapter can observe it at the element boundary. Do not add host
capabilities such as a data gateway, resize API, Dashboard store reference, or
generic event bus without a new architectural decision.

### 4. Register the element from the Widget entrypoint

The entrypoint creates the Widget application's injector and registers exactly
the tag declared by the manifest:

```ts
if (customElements.get("example-widget")) {
  return;
}

const application = createApplication({
  providers: [provideZonelessChangeDetection()],
});

customElements.define("example-widget", createExampleWidgetElement(application));
```

Custom Element names must be lowercase, contain a hyphen, and be globally
unique in the browser session. A tag collision is contained as an unavailable
Widget rather than allowing one Widget implementation to masquerade as
another.

### 5. Publish a manifest

The manifest is the only artifact the host needs to install a Widget. A new
manifest follows this shape:

```json
{
  "manifestVersion": 1,
  "type": "example-widget",
  "displayName": "Example Widget",
  "description": "A concise description shown before adding the Widget",
  "version": "1.0.0",
  "elementTag": "example-widget",
  "entryBundleUrl": "./main.js",
  "defaultConfiguration": {
    "someSetting": true
  },
  "preferredLayout": {
    "w": 4,
    "h": 3
  }
}
```

The `type` identifies a Widget Type; it is not an instance ID. The manifest
must not contain a user's layout, ordering, credentials, or Dashboard
instance configuration. The Dashboard validates the type, display metadata,
version, Custom Element tag, same-origin bundle URL, JSON-safe defaults, and
preferred size before saving the installation.

### 6. Build and publish it

For the reference Widget:

```bash
npx ng build weather-widget --configuration production
```

The output is `dist/weather-widget/`. Publish the generated JavaScript entry
bundle and `widget-manifest.json` together, preserving the relative path
declared by the manifest. A static server must serve JavaScript as a module
and allow the Dashboard origin to fetch the manifest and module. Cross-origin
publishing therefore needs the appropriate CORS headers; an allowlisted origin
is trusted code, not a CORS or sandbox bypass.

Before release, verify all of the following:

- the manifest URL returns JSON with HTTP success;
- `entryBundleUrl` resolves to the intended published bundle;
- the bundle registers the exact `elementTag`;
- the element tag is not shared by another Widget Type;
- default configuration is JSON-safe and produces a usable first render;
- the Widget handles configuration assignment before and after connection;
- changing settings emits a complete replacement configuration;
- the Widget does not depend on a Dashboard-only import path.

## How a built Widget becomes available in the main Dashboard

There are four independent gates. A Widget is usable only after all four pass.

| Gate         | Owner                          | What must be true                                                                                 |
| ------------ | ------------------------------ | ------------------------------------------------------------------------------------------------- |
| Source/build | Widget Author                  | A separate Angular application has a production build target and produces the bundle and manifest |
| Publication  | Widget Author/hosting operator | The manifest and bundle are reachable from one trusted origin with correct module/CORS behavior   |
| Trust        | Dashboard operator             | The manifest origin appears in `provideTrustedManifestOrigins([...])`                             |
| Installation | Dashboard user                 | The user enters the manifest URL and the host validates and stores the installation               |

After installation, the Widget appears in the Dashboard's **Available
Widgets** catalog. Clicking **Add Widget** creates a Dashboard-owned Widget
Instance. There is no static import, registry constant, or Dashboard source
change for each new Widget Type.

For example, an operator configuration for a published Weather origin might be:

```ts
// src/app/app.config.ts
provideTrustedManifestOrigins(['https://widgets.example.test']),
```

The current repository intentionally supplies `[]`, so a fresh deployment
rejects every remote installation until an operator makes this trust decision.
Do not make the allowlist user-editable through the installation form.

## Runtime Widget management and continuity

### Add and render

The shell delegates **Add Widget** to `DashboardStore.addWidget`. The store
copies the manifest defaults into a new instance and calculates a starting
position. The grid component then adapts that instance into GridStack input.
The runtime module loads code only when an instance needs rendering; merely
installing a manifest does not load its entry bundle.

### Move and resize

The Dashboard provides a dedicated **Move** handle for every card. GridStack
owns the transient drag/resize interaction, while
[`gridstack-layout.adapter.ts`](../src/app/dashboard/gridstack-layout.adapter.ts)
converts only the final `{ x, y, w, h }` values into a
`WidgetLayoutChange`. The store validates and persists those values after the
`dragstop` or `resizestop` interaction. Widget code does not receive layout
events or a resize API.

GridStack may compact an item vertically when there is no content below it.
That is presentation behavior; the persisted layout is still the portable
Dashboard layout, never a GridStack node or DOM attribute dump.

### Remove and undo

Removing a Widget Instance changes only the Dashboard Snapshot. The store keeps
the exact instance, index, configuration, and layout in a five-second pending
removal slot. **Undo** writes that exact instance back at its original order.
Removing an installation is a different operation: it changes only the
installation catalog. Existing instances remain in the Dashboard and render
as unavailable cards until the user removes them or the installation becomes
resolvable again.

### Reload and legacy instances

At reload, a structurally valid old built-in instance is still valid Dashboard
data even though its implementation is no longer bundled. It is rendered as an
Unavailable Widget with its saved title/configuration and layout intact. This
is intentionally different from malformed snapshot recovery:

```text
valid legacy instance ──► unavailable card + safe removal
malformed/unsupported ──► recovery screen ──(explicit reset)──► empty seed
```

The Dashboard never silently replaces either case. A user-controlled reset is
the only path that writes the empty seed over a recovery snapshot. The
installation catalog is independent, so resetting the Dashboard does not
silently uninstall Widget Types.

## Widget authoring and host troubleshooting

| Symptom                                    | Likely boundary      | What to inspect                                                                                                       |
| ------------------------------------------ | -------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Manifest is rejected before a request      | Trust/URL validation | The URL is HTTP(S), its exact origin is allowlisted, and it has no credentials                                        |
| Manifest is read but not installed         | Manifest validation  | Version, stable type, hyphenated element tag, same-origin bundle URL, JSON-safe defaults, and positive preferred size |
| Card says loading indefinitely             | Entry bundle         | Network response, module MIME/CORS headers, and whether the loader promise resolves                                   |
| Card becomes unavailable after loading     | Element registration | `customElements.get(elementTag)` exists after the bundle runs and matches the manifest exactly                        |
| Settings appear but do not persist         | Widget contract      | The event name is `configuration-changed`, it bubbles, and `detail` is a complete JSON-safe object                    |
| Old Widget disappeared after migration     | Persistence/recovery | The instance should be structurally valid and unavailable; only an explicit reset should remove it                    |
| Widget code loaded before a card was added | Runtime boundary     | Keep loading behind `WidgetElementComponent` rendering; installation alone should only persist metadata               |

Remember that a trusted Widget is same-page code. It can access the browser
privileges available to the Dashboard page. The origin allowlist must contain
only authors the operator is willing to trust. It is not a security boundary
for an untrusted marketplace.

## Development and verification playbook

Run the host and Widget builds separately so a failure in one application is
not hidden by the other:

```bash
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.spec.json --noEmit
npx ng build da-da-dashboard --configuration production
npx ng build weather-widget --configuration production
```

Run the full browser suite with the Chromium executable configured by the
repository:

```bash
CHROME_BIN="${CHROME_BIN:-/usr/bin/brave-browser}" \
npx ng test --no-watch --browsers=ChromeHeadless
```

The tests use zoneless Angular change detection, controlled in-memory storage,
test manifest sources, test bundle loaders, and test Custom Elements. They do
not depend on a remote Widget server or live weather responses. The important
test layers are:

- persistence tests for versioning, JSON-safe opaque configuration, legacy
  instances, and explicit recovery;
- runtime tests for origin policy, manifest validation, URL resolution,
  installation removal, bundle failure, and element registration;
- Dashboard host tests for install, add, render, configuration replacement,
  layout persistence, move/resize completion, remove/undo, reload, and
  unavailable coexistence;
- Weather tests for provider requests, settings validation, stale request
  protection, and visible loading/success/error states.

If Karma cannot bind its local port, that is a test-runner environment failure,
not a failing assertion. If the runner starts but ChromeHeadless cannot launch,
verify `CHROME_BIN` and the Brave executable before reporting that browser
assertions are unavailable. Keep those infrastructure outcomes distinct from
actual test failures.

## Related decisions

- [ADR-0001: Versioned, explicit-recovery persistence](adr/0001-versioned-explicit-recovery-persistence.md)
- [ADR-0002: Isolate unavailable Widgets](adr/0002-isolate-unavailable-widgets.md)
- [ADR-0009: Load trusted self-contained Widget Elements](adr/0009-load-trusted-self-contained-widget-elements.md)
- [ADR-0010: Install Widgets from allowlisted Manifest URLs](adr/0010-install-widgets-from-allowlisted-manifest-urls.md)
- [ADR-0011: Let Widget Elements own their settings UI](adr/0011-let-widget-elements-own-their-settings-ui.md)
- [ADR-0012: Keep the Widget Element interface to configuration only](adr/0012-keep-the-widget-element-interface-to-configuration-only.md)
