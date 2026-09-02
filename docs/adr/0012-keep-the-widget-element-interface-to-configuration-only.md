# ADR-0012: Keep the Widget Element interface to configuration only

## Status

Accepted

## Context

The Dashboard needs a durable interface for separately built Widget Elements.
Adding speculative host capabilities would create versioning and compatibility
work for every Widget Author without a demonstrated Widget behavior requiring
them.

## Decision

Version one of the Widget Element interface has exactly two application-level
members:

1. The Dashboard assigns a `configuration` property containing a JSON-safe
   Widget Configuration object.
2. The Widget Element dispatches a bubbling `configuration-changed` Custom
   Event whose `detail` is a complete JSON-safe replacement configuration.

The Widget Element applies configuration changes locally. The Dashboard
validates serializability, persists the replacement against the current Widget
Instance, and assigns the persisted value back to the element.

No generic data gateway, event bus, Dashboard store access, resize request,
refresh request, or dialog request exists in version one. The Dashboard owns
the grid and Widget removal. A new capability requires a concrete Widget use
case and a separately documented interface change.

## Consequences

The Widget Element interface is small and deep: Widget Authors receive leverage
from independently owned settings, data fetching, and rendering, while the
Dashboard concentrates persistence and grid behavior behind its own interface.

The Dashboard must treat configuration event details as untrusted input despite
the Widget being trusted code: malformed values should fail safely and leave the
last valid persisted configuration intact.
