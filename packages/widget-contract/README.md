# @da-da/widget-contract

Framework-neutral types and validators for Dashboard Widgets. Use this package
to define a Widget Manifest, validate an unknown manifest before loading it,
and work with the JSON-safe configuration exchanged by Widget Custom Elements
and the Dashboard.

## Install

```bash
npm install @da-da/widget-contract
```

## Define a Widget Manifest

A Widget Author publishes one manifest for a Widget Type. The manifest declares
the content and settings Custom Element tags, the entry bundle, a complete
default configuration, and the Widget's preferred initial grid size.

```ts
import { SUPPORTED_WIDGET_MANIFEST_VERSION, type WidgetManifest } from "@da-da/widget-contract";

export const weatherManifest = {
  manifestVersion: SUPPORTED_WIDGET_MANIFEST_VERSION,
  type: "weather",
  displayName: "Weather",
  description: "Current conditions for a saved location",
  version: "1.0.0",
  elementTag: "example-weather-widget",
  settingsElementTag: "example-weather-widget-settings",
  entryBundleUrl: "./main.js",
  defaultConfiguration: { location: "Warsaw", units: "metric" },
  preferredLayout: { w: 4, h: 3 },
} as const satisfies WidgetManifest;
```

The Widget Type uses lowercase letters, digits, `.`, `_`, and `-`. Element tags
start with a lowercase letter, contain a hyphen, and must be distinct. The
default configuration must be JSON-safe.

## Validate an unknown manifest

Dashboard hosts and tooling should validate data received at a manifest URL
before using it. A valid result has trimmed display text, a resolved entry URL,
and a detached JSON-safe default configuration.

```ts
import { validateWidgetManifest } from "@da-da/widget-contract";

const result = validateWidgetManifest(await (await fetch(manifestUrl)).json(), manifestUrl);

if (result.status === "valid") {
  loadWidget(result.manifest);
} else if (result.reason === "unsupported-version") {
  showUpgradeMessage();
} else {
  rejectManifest(result.reason);
}
```

The manifest URL and entry bundle must be credential-free HTTP(S) URLs. The
entry bundle resolves relative to the manifest and must stay on its origin.
Fragments are removed. Use `decodeJsonObject`, `isJsonObject`, and
`isJsonValue` when validating configuration at other boundaries.

## Widget Element contract

The Dashboard assigns a JSON-safe `configuration` property to both the Widget
Element and its Widget Settings Element. A settings element reports a complete
replacement configuration by dispatching a bubbling
`configuration-changed` event whose detail is that object. The Dashboard
validates and persists the replacement; Widgets should not expect direct access
to Dashboard state, layout controls, or a generic event bus.

For Angular Custom Element registration and the event helper, use
[`@da-da/widget-angular`](../widget-angular/README.md).

## JSON-safe values

Configuration supports finite JSON primitives, arrays, and ordinary objects.
The decoders reject values such as `Date`, functions, `NaN`, cyclic values,
sparse arrays, accessors, and values exceeding their current defensive
depth/count safeguards. Those numeric safeguards are exported for inspection,
but are not compatibility promises.
