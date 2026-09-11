# ADR-0014: Require Settings Elements in version-two Manifests

## Status

Accepted

## Context

The dedicated Widget Settings Element changes the Widget Manifest contract. The
Dashboard is still at an early stage, and retaining support for older Manifests
would add compatibility paths without a current product need.

## Decision

Introduce manifest version two and require every version-two Widget Manifest to
declare its Widget Settings Element tag. Do not support version-one Manifests
after the change.

## Consequences

Existing Widget Authors must publish a version-two Manifest and entry bundle
before their Widgets can be installed or rendered. The Dashboard has one clear
authoring contract rather than a permanent legacy compatibility branch.
