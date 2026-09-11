# Dashboard Glossary

## Dashboard

The single named workspace supported by this milestone. It has a stable UUID,
title, and ordered Widget Instances.

## Widget Instance

One configured, uniquely identified occurrence of a Widget Type in a
Dashboard. It owns its portable Grid Layout and Widget Configuration.

## Widget Type

A stable identifier supplied by a Widget Manifest for the kind of a Widget
Instance. A persisted type can be unavailable when its Widget Installation is
not available to the running application.

## Widget Catalog

A trusted collection of available Widget Manifests from which a Dashboard user
may install a Widget Type. It is not a source of untrusted executable code.

## Widget Manifest

A declarative description produced by a Widget Author. It identifies the Widget
Type, display metadata, preferred Grid Layout size, content and settings Custom
Element tags, and entry bundle needed to load them. It does not contain
Dashboard instance identity, placement, order, or persisted Widget
Configuration.

## Widget Installation

A user-approved record that makes a trusted Widget Manifest available to the
Dashboard. Removing an installation does not remove its existing Widget
Instances; they become Unavailable Widgets.

## Trusted Manifest Origin

An explicitly configured web origin from which the Dashboard may fetch a Widget
Manifest and load its declared entry bundle. A user may provide a Manifest URL
in the installation UI only when its origin is a Trusted Manifest Origin.

## Trusted Widget

A Widget whose executable bundle is accepted from an author or catalog trusted
by the Dashboard operator. Its code runs in the Dashboard page and must be
treated as having the same browser privileges as the Dashboard.

## Widget Element

A browser Custom Element registered by a loaded trusted Widget bundle. The
Dashboard uses its declared tag, properties, and Custom Events rather than
depending on the Widget's Angular implementation.

## Widget Settings Element

A browser Custom Element registered by the Widget's trusted entry bundle and
declared in its Widget Manifest. The Dashboard mounts it in the settings drawer
to render the Widget Settings UI.

## Widget Settings Drawer

The Dashboard-owned desktop panel that presents one Widget Settings Element at a
time. It identifies the selected Widget Type and may be dismissed without
changing the Widget Instance.

## Widget Frame

The Dashboard-owned visual wrapper around a Widget Element or Unavailable
Widget. For an available Widget it provides shared card chrome and the Edit,
Duplicate, and Remove Widget Instance controls; for an Unavailable Widget it
provides only Remove. It does not own Widget-specific content or expose controls
in the mobile read-only Dashboard view.
_Avoid_: widget wrapper, widget card

## Widget Author

The person or team that builds and publishes a separate Widget application and
its Widget Manifest. A Widget Author owns the Widget's data fetching and
domain-specific presentation.

## Unavailable Widget

A persisted Widget Instance whose type cannot currently be resolved to a
renderable implementation. It remains part of its Dashboard and is rendered as
an isolated unavailable-widget card so that it cannot prevent the remaining
Widget Instances from being used.
This includes a Widget whose trusted bundle does not register either Element
declared by its Manifest.

## Widget Configuration

The Widget-Type-specific persisted settings passed to a Widget Element. The
Dashboard stores it but does not interpret its domain fields or supply the
Widget's display data.

## Widget Settings UI

The Widget Author's user interface for viewing and changing Widget
Configuration. It is presented in a Dashboard-owned settings drawer and emits a
serializable replacement configuration for the Dashboard to persist; the
Dashboard does not render Widget-Type-specific settings forms. Persisting a
replacement does not dismiss the drawer.

## Grid Layout

The portable `{ x, y, w, h }` placement owned by a Widget Instance. It is
independent of presentation-library objects.

## Data Source

A stable key in the local deterministic Demo Data catalog. Widget Configuration
persists the key, not refreshed presentation values.

## Dashboard Snapshot

A versioned local-storage envelope containing the one persisted Dashboard. Version
one has `schemaVersion: 1` and a validated Dashboard payload. A malformed,
structurally invalid, or unsupported snapshot is retained untouched and moves the
application into its explicit recovery state until the user resets to defaults.
