# Dashboard Glossary

## Dashboard

The single named workspace supported by this milestone. It has a stable UUID,
title, and ordered Widget Instances.

## Widget Instance

One configured, uniquely identified occurrence of a Widget Type in a
Dashboard. It owns its portable Grid Layout and Widget Configuration.

## Widget Type

A stable identifier for the kind of a Widget Instance. The currently supported
types are `kpi`, `time-series`, and `notes`; a persisted type can also be
unavailable to the running application.

## Widget Registry

The application-startup composition of built-in Widget Type definitions. It is
fixed for the browser session; adding a Widget Type requires a source change,
application build, and deployment. A definition may load its implementation
lazily.

## Widget Definition

The registered, Widget-Type-specific description used by the Dashboard host. It
owns display metadata, default Widget Configuration, preferred Grid Layout size,
and the lazy implementation loader. It does not own Widget Instance identity,
placement, order, or persistence.

## Widget Data Gateway

The narrow application-provided contract through which a Widget implementation
obtains its display data and observes refreshes. It is distinct from the
Dashboard store and does not expose Dashboard management operations.

## Unavailable Widget

A persisted Widget Instance whose type cannot currently be resolved to a
renderable implementation. It remains part of its Dashboard and is rendered as
an isolated unavailable-widget card so that it cannot prevent the remaining
Widget Instances from being used.

## Widget Configuration

The discriminated, Widget-Type-specific persisted settings that determine a
Widget Instance's title and content.

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
