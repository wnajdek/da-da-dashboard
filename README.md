# DaDaDashboard

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.5.

The Dashboard architecture, runtime Widget contract, Weather Widget example,
publishing flow, persistence model, and verification playbook are documented in
[`docs/dashboard-architecture.md`](docs/dashboard-architecture.md).

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Running the Widget locally

The Weather Widget is a separately built application. During local
development, run the Dashboard and the Widget from different origins so the
Dashboard exercises the same manifest-and-bundle loading flow used for a
published Widget.

Use three terminals:

```bash
# Terminal 1: run the main Dashboard
npx ng serve da-da-dashboard --port 4200
```

```bash
# Terminal 2: rebuild the Widget whenever its source changes
npx ng build weather-widget --configuration development --watch
```

```bash
# Terminal 3: serve the generated Widget files with CORS enabled
npx http-server dist/weather-widget/browser --port 4201 --cors
```

The `http-server` command may prompt `npx` to download a temporary copy if the
package is not already available locally. `npx` is npm's command runner; it
uses binaries from this project when available and can run a package binary
without adding it as a project dependency.

Open `http://localhost:4200/` and install this Widget Manifest URL in the
Dashboard:

```text
http://localhost:4201/widget-manifest.json
```

The Widget build writes its files below `dist/weather-widget/browser/`. The
manifest points to `./main.js`, so the Dashboard loads the bundle from the same
port. CORS is required because `localhost:4200` and `localhost:4201` are
different browser origins.

The Dashboard can use `ng serve` because it has an Angular `serve` target in
`angular.json`. The Widget currently has only a build target, so its generated
static files are served with `http-server`. After changing Widget code, reload
the Dashboard page. If the manifest changes, remove the existing Widget
installation and install the Manifest URL again because installations are
persisted in `localStorage`.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

Build the Dashboard host with:

```bash
npx ng build da-da-dashboard --configuration production
```

Build the separately deployed reference Weather Widget with:

```bash
npx ng build weather-widget --configuration production
```

The production artifacts are written to `dist/da-da-dashboard/` and
`dist/weather-widget/`. The Widget manifest and entry bundle must be published
from an origin configured in the Dashboard's Trusted Manifest Origin allowlist.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
CHROME_BIN="${CHROME_BIN:-/usr/bin/brave-browser}" \
npx ng test --no-watch --browsers=ChromeHeadless
```

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
