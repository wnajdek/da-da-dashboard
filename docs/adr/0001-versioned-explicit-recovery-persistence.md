# ADR-0001: Persist versioned Dashboard snapshots with explicit recovery

## Status

Accepted

## Context

The Dashboard is locally persisted and users must retain control when browser
storage holds malformed, structurally invalid, or unsupported data.

## Decision

Store the Dashboard in a version-one snapshot envelope. Validate the envelope and
Dashboard shape before exposing it to application state. Do not replace unusable
saved data automatically; show recovery instead. Only the recovery action may
replace it with the seed Dashboard.

## Consequences

Future snapshot versions must be explicitly supported. The persistence adapter
owns storage and validation, while the signal-backed Dashboard store owns the
load, recovery, and reset outcomes observed by Angular components.
