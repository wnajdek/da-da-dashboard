# ADR-0013: Render Widget Settings with a dedicated Element

## Status

Accepted

## Context

Widget Authors must own their domain-specific settings UI, while the Dashboard
must provide a consistent settings drawer. Rendering settings inside the content
Widget Element either mixes two presentation responsibilities or forces a
host-specific display mode onto it.

## Decision

Each editable Widget Manifest declares a Widget Settings Element tag, registered
by the same trusted entry bundle as its content Widget Element. The Dashboard
mounts that Settings Element only in its own drawer and gives it the persisted
Widget Configuration. The Settings Element dispatches a complete replacement
configuration using the existing `configuration-changed` event. The Dashboard
continues to own the drawer, persistence, validation at the host boundary, and
all Widget Instance management; it does not interpret or render settings fields.

## Consequences

Widget Authors can design settings independently without the Dashboard taking
ownership of their forms, while the Dashboard has a uniform editing surface.
The Widget Manifest and loader must validate that both declared Elements are
registered by the trusted bundle.
