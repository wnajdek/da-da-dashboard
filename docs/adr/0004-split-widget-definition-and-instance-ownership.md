# ADR-0004: Split Widget Definition and Widget Instance ownership

## Status

Accepted

## Context

Widget-specific creation defaults and display metadata are currently duplicated
between the Dashboard store and shell, while the Widget Registry only maps a
Widget Type to an eagerly imported component. The Dashboard must retain
ownership of persisted instance state and grid placement.

## Decision

Each Widget Definition owns Widget-Type-specific display metadata, lazy
implementation loader, default Widget Configuration, and preferred grid width
and height. The Dashboard host/store owns Widget Instance ID, placement,
ordering, persistence, and removal. It chooses the position for a new instance
using the definition's preferred size.

The configuration editor remains a host-side concern for this milestone. Its
per-type editing and validation metadata is not made part of a Widget Definition
yet.

## Consequences

Adding a built-in Widget Type has one authoritative source for defaults and
display metadata, while the Dashboard retains its domain responsibilities. The
configuration-editor switch may remain temporarily; it can be redesigned later
only if the duplication proves harmful.
