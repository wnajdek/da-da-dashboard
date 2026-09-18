# Focus timer

This independent Angular 20 Widget Project publishes one Widget Type: `focus-timer`.
Its complete Widget Configuration is `{ task, durationMinutes }`: a local
countdown has no remote data source.

## Read this example in order

The source is intentionally annotated for Angular developers who are new to
the Dashboard Widget contract. Read it in this order:

1. `src/widget.definition.ts` defines the one public Widget Manifest and the
   two browser Element tags it promises to provide.
2. `src/main.ts` registers those Elements through the Angular integration.
3. `src/widget-configuration.ts` validates the complete configuration that
   crosses the browser boundary.
4. `src/widget.component.ts` implements the content Element; `src/widget-settings.component.ts`
   implements the Settings Element and emits replacement configurations.
5. `src/index.html` is a local preview that demonstrates the event loop. It is
   not a replacement for Dashboard persistence or layout.
6. `scripts/` shows how the Manifest is produced and how the static build is
   checked against the browser contract. The accompanying `*.spec.ts` files
   demonstrate focused Angular unit tests.

It was created with the public command:

```bash
npm run create:widget -- --name focus-timer-widget --type focus-timer --display-name 'Focus timer' --description 'A local countdown for a single focused task' --element-tag sample-focus-timer-widget --settings-element-tag sample-focus-timer-widget-settings --version 1.0.0 --width 3 --height 2 --output projects/focus-timer-widget
```

Run `npm install`, then:

- `npm start` writes and prints http://localhost:4201/widget-manifest.json, then starts the local preview. The development server serves the Manifest and JavaScript module with CORS enabled for installation in a local Dashboard.
- `npm test` runs starter application tests.
- `npm run check` builds and checks the version-two Widget Manifest and browser Custom Element contract.
- `npm run build` produces `dist/focus-timer-widget/browser/`, ready for a static host.

Install the printed Manifest URL in a local Dashboard whose operator has allowlisted `http://localhost:4201`. The preview only exercises the content and settings Widget Elements; it does not emulate Dashboard layout, persistence, installation, trust, or Widget Frame controls. If you change Manifest metadata, remove and reinstall the Widget Installation in the Dashboard before testing it.

The Widget is trusted same-page browser code. Do not place private credentials in it; use an author-owned backend when needed.
