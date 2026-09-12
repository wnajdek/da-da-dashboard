# Widget Development Tools

Status: accepted

## Purpose

Make a trusted Widget straightforward to create, preview, verify, build, and
install without copying the Weather Widget or depending on Dashboard source
code. A developer should reach a working preview within 15 minutes and should
receive actionable failures before trying an invalid Widget in the Dashboard.

The Dashboard's extension boundary remains the version-two Widget Manifest and
the two browser Custom Elements. Angular is the first supported authoring
framework, not part of the permanent host contract.

## Users and operating model

- A Widget Author creates an independent Widget Project for their own trusted
  Dashboard environment.
- One Widget Project publishes exactly one Widget Type.
- A Widget Project can live beside the Dashboard in this repository for
  convenience, but it cannot import Dashboard source code.
- The Dashboard operator remains responsible for choosing Trusted Manifest
  Origins.
- Widget code remains trusted, same-page browser code with the same browser
  privileges as the Dashboard.

## Public deliverables

The first release consists of three separately consumable tools. Their final
npm names will be chosen before publication.

### Framework-neutral contract package

This package contains only browser- and data-level definitions shared by Widget
Authors and their tooling:

- the supported Manifest version;
- the version-two Widget Manifest type;
- JSON-safe value and object types;
- the Widget Element configuration-property shape;
- the `configuration-changed` event name and event-detail type;
- framework-neutral Manifest and JSON-safety validation;
- stable diagnostics suitable for the project checker.

It must not depend on Angular or expose Dashboard store, layout-library, routing,
installation, persistence, or UI types.

### Angular integration package

This package implements repetitive Angular authoring mechanics:

- create one Angular application environment for the Widget bundle;
- wrap content and settings components as Custom Elements;
- apply configuration assigned before or after connection;
- update mounted component inputs in place;
- detach and reconnect views safely;
- register the two tags declared by the Widget definition;
- reject tag collisions before partially registering a Widget;
- provide a helper for dispatching a valid bubbling configuration replacement.

The package supports Angular 20 only in its first release and declares that
support through peer dependencies. It must fail clearly when installed with an
unsupported Angular major.

### Project-creation command

The command creates a complete, independent Angular Widget Project. It asks for
or accepts command-line values for at least:

- project name;
- Widget Type;
- display name and optional description;
- content and settings Element tags;
- initial version;
- preferred width and height.

The generated project includes content and settings components, a typed Widget
definition, configuration reading and validation, starter tests, a preview,
conformance checks, and development/build scripts. Generation happens once;
later tool upgrades must never overwrite author-owned application code.

## Single Widget definition

Each Widget Project declares its author-owned metadata and defaults exactly once
in TypeScript. Conceptually:

```ts
export default defineWidget({
  type: 'weather',
  displayName: 'Weather',
  version: '1.0.0',
  elementTag: 'sample-weather-widget',
  settingsElementTag: 'sample-weather-widget-settings',
  defaultConfiguration: {
    location: 'Cracow',
    units: 'metric',
  },
  preferredLayout: { w: 4, h: 3 },
});
```

The build generates `widget-manifest.json` from this definition. Element
registration and conformance checks consume the same definition, eliminating
duplicate tags, defaults, and metadata in source, JSON, and tests.

The generated JSON is not trusted merely because the contract package produced
it. The Dashboard continues to validate the fetched Manifest independently.

## Widget Configuration

TypeScript alone cannot validate configuration recovered from storage or
received at runtime. Every generated Widget Project therefore owns a runtime
configuration reader that accepts `unknown` and either returns a valid typed
configuration or an explicit invalid result.

The generated starter demonstrates how to:

- reject or safely recover malformed values;
- show useful validation feedback;
- use defaults deliberately rather than silently;
- emit only complete, validated replacement configurations;
- keep all domain-specific fields and rules out of the Dashboard and shared
  packages.

Version one does not derive domain validation or a settings form from a schema.

## Local development workflow

A generated project exposes a small command set equivalent to:

```text
npm start       start the Widget development server and preview
npm test        run application and contract tests
npm run check   build and run browser-based conformance checks
npm run build   produce ready-to-host static files
```

The development server prints the Widget Manifest URL. The preview mounts the
content and settings Elements, assigns sample configuration, and demonstrates
that a settings save updates the content Element. It does not reproduce the
Dashboard grid, persistence, installation catalog, or trust policy.

For final integration, the Widget Author installs the printed Manifest URL in a
real local Dashboard whose operator has allowlisted that origin. If Manifest
metadata changes, the author removes and reinstalls it. Automatic or silent
Manifest refresh is out of scope.

## Conformance checks

The checker runs the built Widget in a headless browser and reports precise,
author-facing diagnostics. It verifies at least that:

1. the generated Manifest satisfies the supported version-two shape;
2. the declared entry bundle exists in the build output;
3. importing the bundle registers exactly the declared content and settings
   Element tags without a partial registration after collision;
4. each Element accepts configuration assigned before and after connection;
5. the settings Element emits a bubbling `configuration-changed` event;
6. emitted event detail is a complete JSON-safe object;
7. the build output contains the Manifest and self-contained bundle needed for
   static hosting.

The checker is part of the Widget Project's test/build workflow, not a separate
long-running application. A successful check does not bypass Dashboard-side
validation or origin trust.

## Production output

`npm run build` produces one directory containing the version-two Widget
Manifest and its self-contained entry bundle. The files are ready for any
static host that serves JavaScript modules, makes the Manifest and bundle
reachable from the same origin, and permits the Dashboard origin through CORS.

The tools do not upload files or prescribe GitHub Pages, object storage, nginx,
or another hosting provider in version one.

## Security boundary

The generated Widget runs in the browser and must never contain secret
credentials. A Widget that needs private credentials owns a separate backend;
backend generation, authentication, authorization, and secret management are
outside these tools.

The tools are for trusted Widgets only. Supporting untrusted third-party code
would require an iframe and message-based runtime and is a separate
architectural effort.

## Versioning and release policy

- All packages are public from their first release.
- Initial releases use pre-1.0 versions while their interfaces are being proven.
- The selected tool version checks one explicit Widget contract and Manifest
  version.
- Non-breaking fixes remain within the same package major version.
- Incompatible public API or contract changes require an explicit major-version
  change; existing Widget Projects are never rewritten silently.
- Version 1.0 requires evidence from both the Weather Widget and a second,
  contrasting Widget Project.

## Delivery sequence

### Stage 1: Contract and definition

- Extract the framework-neutral types, constants, and validators.
- Introduce the single typed Widget definition and Manifest generation.
- Make Dashboard validation consume the neutral definitions without weakening
  its independent runtime boundary.

### Stage 2: Angular integration

- Extract the generic Custom Element lifecycle and registration behavior from
  Weather-specific code.
- Migrate the Weather Widget to the contract and Angular packages.
- Preserve its existing content, settings, data, and configuration behavior.

### Stage 3: Generator and preview

- Generate an independent Angular 20 Widget Project.
- Add the small content/settings preview and development server.
- Ensure the generated project contains no Weather-specific source.

### Stage 4: Conformance and second proof Widget

- Add browser-based checks for the built Manifest, bundle, Elements,
  configuration property, and event.
- Build a second Widget Project with meaningfully different configuration and
  presentation.
- Remove any special cases exposed by running both Widgets through the same
  public interfaces.

### Stage 5: Public prerelease

- Choose available public npm package and command names.
- Publish pre-1.0 releases with installation and migration documentation.
- Verify a newly generated project outside this repository against a local
  Dashboard.

## Version 1.0 readiness

The tools are ready for version 1.0 only when:

- a new developer can generate a project and see its preview within 15 minutes;
- the generated project contains no Weather-specific code;
- Weather and the second proof Widget use the same public packages without
  tool-side special cases;
- both pass the same browser-based conformance checks;
- both builds produce a valid Manifest and self-contained entry bundle;
- neither Widget Project imports Dashboard source;
- the Dashboard still treats the Manifest, loaded Elements, and configuration
  events as boundary input and preserves Unavailable Widget containment.

## Out of scope for version one

- untrusted or sandboxed Widgets;
- frameworks other than Angular 20;
- more than one Widget Type per Widget Project;
- optional Settings Elements or a new Manifest version;
- schema-generated settings forms;
- automatic Manifest refresh or installation;
- deployment-provider integrations;
- backend generation, authentication, or secret storage;
- a shared Dashboard theming API;
- a central public Widget marketplace or catalog.
