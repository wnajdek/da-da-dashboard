# Dashboard Glossary

## Dashboard

The single named workspace supported by this milestone. It has a stable UUID,
title, and ordered Widget Instances.

## Widget Instance

One configured, uniquely identified occurrence of a built-in Widget Type in a
Dashboard. It owns its portable Grid Layout and Widget Configuration.

## Widget Type

The supported kind of a Widget Instance: `kpi`, `time-series`, or `notes`.

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
