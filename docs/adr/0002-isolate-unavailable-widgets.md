# ADR-0002: Isolate unavailable Widgets during dashboard rendering

## Status

Accepted

## Context

A Dashboard Snapshot can contain a structurally valid Widget Instance whose
Widget Type cannot currently be resolved to an implementation. This can arise
from a removed built-in Widget Type now and is a realistic future condition for
optional widget implementations. Treating that one instance as a dashboard-wide
recovery failure would prevent users from accessing unrelated Widget Instances.

## Decision

Keep a structurally valid, unresolved Widget Instance in the Dashboard and
render an unavailable-widget card in its place. The card must identify the
unavailable type and provide a safe removal path. The rest of the Dashboard
continues to render and remain editable.

Use the same card when a registered Widget Definition's lazy implementation
loader fails. From the Dashboard user's perspective, the Widget Instance is
unavailable regardless of whether its type is unregistered or its code chunk
could not load.

For this milestone, the unavailable-widget card does not retry loading, expose
diagnostic details, or support editing. It is a containment mechanism, not a
plugin-management UI.

Malformed, structurally invalid, or unsupported Dashboard Snapshots remain
subject to ADR-0001's explicit recovery flow. This decision does not make
arbitrary unknown snapshot shapes valid.

## Consequences

Widget resolution becomes a runtime rendering concern rather than proof that a
Dashboard Snapshot is valid. Persistence validation must distinguish a
well-formed Widget Instance with an unavailable type from a malformed Widget
Instance. The Widget registry/host needs an explicit resolution result instead
of assuming every persisted type maps to a component.
