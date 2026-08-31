# ADR-0008: Have Widget loaders resolve only their implementation component

## Status

Accepted

## Context

Widget Definition metadata is composed statically at application startup, while
the implementation is loaded later. Returning a second, richer definition from
the lazy chunk would duplicate static metadata and imply an independent runtime
registration protocol.

## Decision

A Widget Definition's loader resolves only its Angular implementation component
type. The static definition remains the authoritative source for metadata,
defaults, and preferred size.

## Consequences

The lazy boundary is small and easy to test. Widget chunks do not register
themselves or negotiate metadata with the host. A future external-widget design
may choose a richer manifest/loaded contract, but that is intentionally not
introduced here.
