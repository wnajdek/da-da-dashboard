# ADR-0005: Keep the Widget host contract minimal

## Status

Accepted

## Context

Widget implementations need configuration and display data while the Dashboard
host owns Widget Instance lifecycle, persistence, layout, and management
controls. Passing complete instances and allowing access to the Dashboard store
would expose host concerns with no current use case.

## Decision

The host passes each implementation its Widget-Type-specific configuration as a
signal input. The implementation obtains display data through the narrow,
injected Widget Data Gateway rather than from the Dashboard host or Dashboard
store. Edit and removal controls remain outside the implementation in the
Dashboard host.

This milestone defines no generic widget-to-host event bus, action API, or
Widget Context containing the full Widget Instance. Add a typed output or a
narrow host capability only in response to a concrete Widget behavior.

The configuration editor remains host-side. Loading Widget-provided
configuration-form implementations dynamically is deferred because it requires
its own contract for form values, validation, and compatibility.

## Consequences

Widget implementations receive only data relevant to rendering and can evolve
toward a deliberately limited platform API. The Dashboard stays independent of
widget display-data shapes. The existing full `WidgetContext` input should be
replaced rather than carried into the new boundary.
