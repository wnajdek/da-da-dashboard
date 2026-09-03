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

| File | Responsibility |
| --- | --- |
| [`dashboard.models.ts`](../src/app/dashboard/dashboard.models.ts) | Core Dashboard, Widget Instance, layout, and configuration types |
| [`dashboard.seed.ts`](../src/app/dashboard/dashboard.seed.ts) | Creates the initial empty Dashboard |
| [`dashboard.store.ts`](../src/app/dashboard/dashboard.store.ts) | Owns live Dashboard state and Dashboard mutations |
| [`dashboard-persistence.service.ts`](../src/app/dashboard/dashboard-persistence.service.ts) | Loads, validates, and saves Dashboard snapshots |
| [`dashboard-shell.component.ts`](../src/app/dashboard/dashboard-shell.component.ts) | Main Dashboard page and installation controls |
| [`dashboard-grid.component.ts`](../src/app/dashboard/dashboard-grid.component.ts) | Renders the grid and connects it to GridStack |
| [`gridstack-layout.adapter.ts`](../src/app/dashboard/gridstack-layout.adapter.ts) | Translates between Dashboard layouts and GridStack layouts |
| [`json-value.ts`](../src/app/dashboard/json-value.ts) | Defines and validates JSON-safe values |
| [`widget-manifest.ts`](../src/app/dashboard/widget-manifest.ts) | Validates and normalizes Widget Manifests |
| [`widget-runtime.service.ts`](../src/app/dashboard/widget-runtime.service.ts) | Applies trust checks, fetches manifests, and manages installations |
| [`widget-installation-persistence.service.ts`](../src/app/dashboard/widget-installation-persistence.service.ts) | Loads and saves the installation catalog |
| [`unavailable-widget-card.component.ts`](../src/app/dashboard/unavailable-widget-card.component.ts) | Safe fallback for unresolved Widget Instances |
| [`widget-card.scss`](../src/app/dashboard/widget-card.scss) | Widget-card styling |
| `*.spec.ts` | Tests persistence, validation, recovery, layout translation, and installation behavior |

## Current implementation status

The architecture documents describe the intended external-widget direction.
The repository already contains the Dashboard persistence, installation
persistence, manifest validation, trust policy, and unavailable-widget
foundations.

At present, the grid still renders each Dashboard Widget Instance as an
unavailable-widget card. The runtime service installs and lists manifests, but
the final step that loads the declared entry bundle, creates the declared Custom
Element, and connects it to a Widget Instance is not yet wired into the grid.

The older ADRs describing a static built-in Angular Widget Registry are
transitional history. ADR-0009 and the later ADRs define the current external
Widget direction.

## Related decisions

- [ADR-0001: Versioned, explicit-recovery persistence](adr/0001-versioned-explicit-recovery-persistence.md)
- [ADR-0002: Isolate unavailable Widgets](adr/0002-isolate-unavailable-widgets.md)
- [ADR-0009: Load trusted self-contained Widget Elements](adr/0009-load-trusted-self-contained-widget-elements.md)
- [ADR-0010: Install Widgets from allowlisted Manifest URLs](adr/0010-install-widgets-from-allowlisted-manifest-urls.md)
- [ADR-0011: Let Widget Elements own their settings UI](adr/0011-let-widget-elements-own-their-settings-ui.md)
- [ADR-0012: Keep the Widget Element interface to configuration only](adr/0012-keep-the-widget-element-interface-to-configuration-only.md)
