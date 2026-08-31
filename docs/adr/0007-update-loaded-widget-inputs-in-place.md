# ADR-0007: Update loaded Widget configuration inputs in place

## Status

Accepted

## Context

Saving a Widget Configuration changes the persisted Widget Instance while its
implementation may already be rendered. Recreating that implementation would
discard any local UI state and add lifecycle complexity without a requirement
for it.

## Decision

Keep a successfully loaded Widget implementation mounted while its Widget Type
is unchanged and update its configuration input when the host state changes.
Recreate an implementation only when its resolved component type changes or
when its card is removed.

## Consequences

The rendering approach must support reactive dynamic input updates. Ordinary
configuration edits do not need imperative component-reference management.
