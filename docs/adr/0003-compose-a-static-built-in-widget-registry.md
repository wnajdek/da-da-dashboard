# ADR-0003: Compose a static built-in Widget Registry at application startup

## Status

Accepted

## Context

The Dashboard needs a proper Widget Registry and lazy implementation loading,
but this milestone deliberately excludes runtime installation, external bundles,
and third-party plugin management.

## Decision

Compose the Widget Registry from declarative built-in definitions at Angular
application startup and keep it immutable for the running browser session. A
Widget Definition may use a dynamic import to load its Angular implementation
only when required.

Users may add multiple Widget Instances of the built-in Widget Types. Adding a
new Widget Type requires changing application source, building, and deploying a
new application version. The registry has no runtime `register` or `unregister`
operation in this milestone.

## Consequences

The implementation can establish a registry abstraction and lazy chunks without
introducing manifests, uploaded code, plugin lifecycle management, or trust and
sandboxing concerns. The distinction between a currently registered Widget Type
and an unavailable persisted Widget Type remains necessary under ADR-0002.
