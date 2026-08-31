# ADR-0006: Load Widget implementations when their cards render

## Status

Accepted

## Context

The Dashboard's seeded Widget Instances are rendered at initial dashboard
display. Lazy implementation loading must reduce the initial application bundle
without making this milestone responsible for viewport scheduling or elaborate
loading policies.

## Decision

Begin a Widget Definition's lazy implementation load when its Dashboard card is
rendered. Show a small per-card loading state until resolution succeeds or the
unavailable-widget card replaces it after failure.

Do not defer loading until viewport visibility in this milestone.

## Consequences

Widget implementation code can be emitted outside the initial bundle, even
though cards initially visible on the Dashboard will request their chunks soon
after rendering. The host has a straightforward loading/resolved/unavailable
state per Widget Instance.
