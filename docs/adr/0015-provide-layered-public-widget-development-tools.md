# ADR-0015: Provide layered public Widget Development Tools

## Status

Accepted

## Context

Creating a Widget Project currently requires authors to reproduce Angular
Custom Element lifecycle code, registration logic, Manifest data, tests, build
configuration, and a multi-process local development setup. Packaging all of
that as one Angular-specific SDK would reduce some repetition but would also
risk coupling the Dashboard's long-lived Widget contract to Angular.

## Decision

Develop and release public Widget Development Tools in three layers: a
framework-neutral contract package, an Angular integration package, and a
project-creation command. The tools will initially be developed in this
repository and published as prerelease packages, while every generated Widget
Project remains independently buildable and publishes exactly one Widget Type.

The project-creation command will generate an Angular 20 Widget Project whose
single typed Widget definition produces its version-two Widget Manifest and
drives Element registration and contract checks. The generated project will
include author-owned runtime Widget Configuration validation, a small preview
of the content/settings interaction, browser-based conformance checks, and a
self-contained static build output.

The tools implement the author side of the existing trusted Widget contract;
they do not expand it. The Dashboard continues to load trusted same-page Custom
Elements, require both content and settings Elements, validate every Manifest
and configuration event at its own boundary, and remain independent of the
Widget's framework.

## Consequences

Angular is the only supported authoring framework initially, but another
framework can implement the same browser contract without using the Angular
package. Public releases remain pre-1.0 until the Weather Widget and a second,
contrasting Widget Project use the same public interfaces and pass the same
conformance checks.

Version one does not provide deployment automation, backend services, secret
management, a shared theming API, support for multiple Angular majors, or
automatic refresh of installed Manifests. During development, an author
reinstalls a changed Manifest in the Dashboard.
