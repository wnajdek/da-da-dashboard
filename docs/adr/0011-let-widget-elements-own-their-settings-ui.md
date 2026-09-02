# ADR-0011: Let Widget Elements own their settings UI

## Status

Accepted

## Context

An independently authored Widget defines its own domain settings, such as a
weather location or display units. A Dashboard-side editor would need knowledge
of every Widget Type and would require a Dashboard deployment whenever a Widget
Author changed their settings.

## Decision

Each Widget Element renders its own Widget Settings UI. The Dashboard passes
the persisted Widget Configuration to the element as an opaque, JSON-safe
object. When a user saves settings, the element dispatches one documented
Custom Event containing a complete replacement Widget Configuration. The
Dashboard validates only that the event payload is serializable and then
persists it against the current Widget Instance.

The Dashboard does not define, render, or validate Widget-Type-specific settings
fields. The Widget Author validates the configuration it receives and produces.

## Consequences

Widget Authors can evolve their settings independently from the Dashboard. The
host-to-widget interface has a small, durable configuration property and one
configuration-change event.

The Dashboard cannot give per-field validation messages or build generic forms.
The Widget Settings UI must provide its own validation and user feedback.
