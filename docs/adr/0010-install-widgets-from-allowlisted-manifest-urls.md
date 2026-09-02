# ADR-0010: Install trusted Widgets from allowlisted Manifest URLs

## Status

Accepted

## Context

Trusted Widget Authors need a low-friction way to make separately built Widgets
available through the Dashboard UI. A centrally managed Widget Catalog would
make discovery more polished, but it also requires catalog ownership and an
author publishing workflow before the core installation mechanism can be used.

## Decision

The installation UI accepts a Widget Manifest URL. Before fetching it, the
Dashboard checks that its origin is a Trusted Manifest Origin. It rejects URLs
from all other origins. A valid Manifest supplies the Widget metadata and entry
bundle URL for one Widget Installation.

The allowlist is Dashboard-operator configuration, not a value a Widget Author
or ordinary Dashboard user can change through the Widget installation flow.

## Consequences

Widget Authors can independently host a Manifest and bundle at an approved
origin. Users need the Manifest URL to install a Widget. The same Manifest
format can later feed a centrally managed Widget Catalog without changing the
Widget runtime.

Origin allowlisting establishes a trust policy but does not isolate loaded code.
An approved origin must be operated by a trusted Widget Author. URL validation,
Manifest validation, load failure handling, and persistence of Widget
Installations are required implementation work.
