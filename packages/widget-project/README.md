# @da-da/create-widget

Creates an independent Angular Dashboard Widget Project. The generated project
contains a typed version-two Widget Manifest, content and settings components,
configuration validation, browser conformance tests, a static production build,
and local development scripts.

## Create a project

Run the generator interactively:

```bash
npx @da-da/create-widget
```

Or provide all required values for a non-interactive run:

```bash
npx @da-da/create-widget \
  --name weather-widget \
  --type weather \
  --display-name Weather \
  --description 'Current conditions for a saved location' \
  --element-tag example-weather-widget \
  --settings-element-tag example-weather-widget-settings \
  --version 1.0.0 \
  --width 4 \
  --height 3 \
  --output ./weather-widget
```

The generator never overwrites an existing output directory. Project names and
Widget Types use lowercase letters, digits, and hyphens. Element tags must be
distinct valid Custom Element tags; width and height are positive whole
numbers, with width at most 12.

To see the supported options:

```bash
npx @da-da/create-widget --help
```

## Work on the generated Widget

```bash
cd weather-widget
npm install
npm start
```

`npm start` writes a development Widget Manifest and serves it at
`http://localhost:4201/widget-manifest.json`. Install that URL in a Dashboard
whose operator allows the origin. The Widget's bundle and manifest must be
served from the same origin.

Use the generated commands while developing:

```bash
npm test       # Angular browser tests
npm run build  # static production bundle and widget-manifest.json
npm run check  # build plus Widget contract conformance checks
```

The project depends on `@da-da/widget-contract` for its framework-neutral
manifest/configuration contract and `@da-da/widget-angular` for Angular Custom
Element registration. See those packages' READMEs for the lower-level APIs.
