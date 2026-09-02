# ADR-0009: Load trusted self-contained Widget Elements at runtime

## Status

Accepted

Supersedes ADR-0003, ADR-0005, and ADR-0008 for the external-widget direction.

## Context

The Dashboard is intended to be extensible by Widget Authors who build Widgets
as separate applications. A Dashboard user must be able to add a trusted Widget
through the UI without a Dashboard source change or redeployment.

The previous internal Widget Registry loads Angular component types compiled
with the Dashboard. It cannot load a separately built Widget application and
the Widget Data Gateway makes the Dashboard responsible for Widget-specific
display data.

## Decision

Represent an installable Widget with a Widget Manifest and Widget Installation.
The Dashboard loads the entry bundle declared by an installed Manifest at
runtime. The bundle registers one declared browser Custom Element, called the
Widget Element. The Dashboard renders that element by tag and communicates only
through an explicitly documented property and Custom Event interface.

Widget code is trusted code. This milestone permits installation only from
Widget Authors or catalogs trusted by the Dashboard operator; it does not claim
to sandbox untrusted code.

Widget Authors own Widget-specific data fetching, credentials appropriate to
their own browser execution, refresh behavior, and domain presentation. The
Dashboard owns only Widget Instance identity, grid placement, persistence,
selection, and removal. It passes persisted Widget Configuration to the Widget
Element but does not provide Widget-specific display data.

## Consequences

The Widget Catalog and installation UI need a manifest format, validation,
compatibility checks, and an explicit trust policy. The host-to-widget interface
must remain small because it becomes a long-lived compatibility commitment.

The existing static Widget Registry and Widget Data Gateway are transitional
implementation details, not the target extension mechanism. The Dashboard must
render an Unavailable Widget when an installed Widget cannot load or does not
register its declared Widget Element.

This does not support arbitrary end-user JavaScript safely. A future untrusted
marketplace would require a sandboxed iframe runtime and a message-based
interface, rather than direct Custom Element loading.
