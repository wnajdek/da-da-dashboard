#!/usr/bin/env node
import { access, mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createInterface } from "node:readline/promises";

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const optionsWithValues = new Set([
  "name",
  "type",
  "display-name",
  "description",
  "element-tag",
  "settings-element-tag",
  "version",
  "width",
  "height",
  "output",
]);
const MAX_PREFERRED_WIDGET_WIDTH = 12;
const SEMANTIC_VERSION =
  /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:(?:0|[1-9]\d*)|(?:\d*[A-Za-z-][0-9A-Za-z-]*))(?:\.(?:(?:0|[1-9]\d*)|(?:\d*[A-Za-z-][0-9A-Za-z-]*)))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

export async function createWidgetProject(arguments_, environment = process) {
  const supplied = parseArguments(arguments_);

  if (supplied.help) {
    environment.stdout.write(usage());
    return;
  }

  const values = await completeValues(supplied, environment);
  const project = validateProject(values, environment.cwd());
  await assertOutputDoesNotExist(project.outputDirectory);
  await writeProject(project);
  environment.stdout.write(
    `Created ${project.displayName} at ${project.outputDirectory}.\n` +
      "Run npm install, then npm start, npm test, npm run check, or npm run build.\n",
  );
}

function parseArguments(arguments_) {
  const values = {};

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];

    if (argument === "--help" || argument === "-h") {
      values.help = true;
      continue;
    }

    if (!argument.startsWith("--")) {
      throw new Error(`Unexpected argument "${argument}".`);
    }

    const [option, inlineValue] = argument.slice(2).split("=", 2);

    if (!optionsWithValues.has(option)) {
      throw new Error(`Unknown option "--${option}".`);
    }

    const value = inlineValue ?? arguments_[index + 1];

    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Option "--${option}" requires a value.`);
    }

    values[camelCase(option)] = value;

    if (inlineValue === undefined) {
      index += 1;
    }
  }

  return values;
}

async function completeValues(supplied, environment) {
  if (!environment.stdin.isTTY) {
    return supplied;
  }

  const prompt = createInterface({
    input: environment.stdin,
    output: environment.stdout,
  });
  const values = { ...supplied };

  try {
    for (const [name, question, optional] of [
      ["name", "Project name", false],
      ["type", "Widget Type", false],
      ["displayName", "Display name", false],
      ["description", "Description (optional)", true],
      ["elementTag", "Content Element tag", false],
      ["settingsElementTag", "Settings Element tag", false],
      ["version", "Initial version", false],
      ["width", "Preferred width", false],
      ["height", "Preferred height", false],
      ["output", "Output directory", true],
    ]) {
      if (values[name] === undefined) {
        const answer = await prompt.question(`${question}: `);
        if (answer.trim().length > 0 || !optional) {
          values[name] = answer;
        }
      }
    }
  } finally {
    prompt.close();
  }

  return values;
}

function validateProject(values, cwd) {
  const name = requiredText(values.name, "Project name");
  const type = requiredText(values.type, "Widget Type");
  const displayName = requiredText(values.displayName, "Display name");
  const description = optionalText(values.description, "Description");
  const elementTag = requiredText(values.elementTag, "Content Element tag");
  const settingsElementTag = requiredText(
    values.settingsElementTag,
    "Settings Element tag",
  );
  const version = requiredText(values.version, "Initial version");
  const width = positiveInteger(
    values.width,
    "Preferred width",
    MAX_PREFERRED_WIDGET_WIDTH,
  );
  const height = positiveInteger(values.height, "Preferred height");

  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new Error(
      "Project name must use lowercase letters, digits, and hyphens.",
    );
  }
  if (!/^[a-z][a-z0-9-]*$/.test(type)) {
    throw new Error(
      "Widget Type must use lowercase letters, digits, and hyphens.",
    );
  }
  for (const [label, tag] of [
    ["Content Element tag", elementTag],
    ["Settings Element tag", settingsElementTag],
  ]) {
    if (!/^[a-z][a-z0-9._-]*-[a-z0-9._-]+$/.test(tag)) {
      throw new Error(`${label} must be a valid Custom Element tag.`);
    }
  }
  if (elementTag === settingsElementTag) {
    throw new Error("Content and Settings Element tags must be distinct.");
  }
  if (!SEMANTIC_VERSION.test(version)) {
    throw new Error(
      "Initial version must be a semantic version such as 1.0.0.",
    );
  }

  const outputDirectory = resolve(cwd, values.output ?? name);
  return {
    name,
    type,
    displayName,
    description,
    elementTag,
    settingsElementTag,
    version,
    width,
    height,
    outputDirectory,
  };
}

function requiredText(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} is required.`);
  }
  return value.trim();
}

function optionalText(value, label) {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new Error(`${label} must be text.`);
  }
  return value.trim() || undefined;
}

function positiveInteger(value, label, maximum = Number.POSITIVE_INFINITY) {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    throw new Error(`${label} must be a positive whole number.`);
  }
  const number = Number(value);

  if (number > maximum) {
    throw new Error(`${label} cannot exceed ${maximum}.`);
  }

  return number;
}

async function assertOutputDoesNotExist(outputDirectory) {
  try {
    await access(outputDirectory);
  } catch {
    return;
  }
  throw new Error(
    `Output directory already exists: ${outputDirectory}. Existing author application code is never overwritten.`,
  );
}

async function writeProject(project) {
  const files = await projectFiles(project);
  await mkdir(project.outputDirectory, { recursive: true });
  await Promise.all(
    files.map(async ([path, body]) => {
      const destination = resolve(project.outputDirectory, path);
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, body, "utf8");
    }),
  );
}

async function projectFiles(project) {
  const definitionName = constantName(project.name);
  const title = escapeHtml(project.displayName);
  const description =
    project.description === undefined
      ? ""
      : `\n  description: ${literal(project.description)},`;

  return [
    [".gitignore", "/node_modules\n/dist\n/.angular\n/out-tsc\n"],
    [
      "package.json",
      `${JSON.stringify(
        {
          name: project.name,
          version: project.version,
          private: true,
          type: "module",
          scripts: {
            start: "node scripts/start-widget.mjs",
            test: 'CHROME_BIN="${CHROME_BIN:-/usr/bin/brave-browser}" ng test --no-watch --browsers=ChromeHeadless',
            check: `npm run build && node scripts/check-built-widget.mjs dist/${project.name}/browser`,
            build: `npm run compile:definition && ng build --configuration production && node scripts/write-widget-manifest.mjs out-tsc/widget-definition/widget.definition.js dist/${project.name}/browser/widget-manifest.json`,
            "compile:definition": "tsc --project tsconfig.definition.json",
          },
          dependencies: {
            "@angular/common": "^20.1.0",
            "@angular/core": "^20.1.0",
            "@angular/platform-browser": "^20.1.0",
            "@da-da/widget-angular": "^0.1.0",
            "@da-da/widget-contract": "^0.1.0",
            tslib: "^2.3.0",
          },
          devDependencies: {
            "@angular/build": "^20.1.5",
            "@angular/cli": "^20.1.5",
            "@angular/compiler-cli": "^20.1.0",
            "@types/jasmine": "~5.1.0",
            "jasmine-core": "~5.8.0",
            karma: "~6.4.0",
            "karma-chrome-launcher": "~3.2.0",
            "karma-coverage": "~2.2.0",
            "karma-jasmine": "~5.1.0",
            "karma-jasmine-html-reporter": "~2.1.0",
            typescript: "~5.8.2",
          },
        },
        null,
        2,
      )}\n`,
    ],
    ["angular.json", angularConfiguration(project.name)],
    ["tsconfig.json", typescriptConfiguration()],
    ["tsconfig.app.json", applicationTypescriptConfiguration()],
    ["tsconfig.spec.json", specTypescriptConfiguration()],
    ["tsconfig.definition.json", definitionTypescriptConfiguration()],
    ["public/.gitkeep", ""],
    [
      "src/widget.definition.ts",
      `import type { WidgetManifest } from '@da-da/widget-contract';

export const ${definitionName}_DEFINITION = {
  manifestVersion: 2,
  type: ${literal(project.type)},
  displayName: ${literal(project.displayName)},${description}
  version: ${literal(project.version)},
  elementTag: ${literal(project.elementTag)},
  settingsElementTag: ${literal(project.settingsElementTag)},
  entryBundleUrl: './main.js',
  defaultConfiguration: { title: ${literal(project.displayName)} },
  preferredLayout: { w: ${project.width}, h: ${project.height} },
} as const satisfies WidgetManifest;
`,
    ],
    [
      "src/widget-configuration.ts",
      `import { ${definitionName}_DEFINITION } from './widget.definition';

export interface WidgetConfiguration {
  readonly [key: string]: string;
  readonly title: string;
}

export type WidgetConfigurationReadResult =
  | { readonly status: 'valid'; readonly configuration: WidgetConfiguration }
  | { readonly status: 'invalid'; readonly configuration: WidgetConfiguration; readonly message: string };

export const DEFAULT_WIDGET_CONFIGURATION: WidgetConfiguration =
  ${definitionName}_DEFINITION.defaultConfiguration;

export function readWidgetConfiguration(value: unknown): WidgetConfigurationReadResult {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return invalidConfiguration('Enter a title.');
  }

  const record = value as Record<string, unknown>;
  const title = typeof record['title'] === 'string' ? record['title'].trim() : '';

  return title.length > 0
    ? { status: 'valid', configuration: { title } }
    : invalidConfiguration('Enter a title.');
}

function invalidConfiguration(message: string): WidgetConfigurationReadResult {
  return { status: 'invalid', configuration: DEFAULT_WIDGET_CONFIGURATION, message };
}
`,
    ],
    [
      "src/widget.component.ts",
      `import { Component, effect, input, signal } from '@angular/core';
import { DEFAULT_WIDGET_CONFIGURATION, readWidgetConfiguration } from './widget-configuration';

@Component({
  selector: 'widget-content',
  template: \`
    <article aria-labelledby="widget-title">
      <p class="eyebrow">${title}</p>
      @if (message(); as feedback) {
        <p role="alert">{{ feedback }}</p>
      } @else {
        <h1 id="widget-title">{{ title() }}</h1>
        <p>Customize this starter Widget with author-owned content.</p>
      }
    </article>
  \`,
  styles: \`
    :host { display: block; height: 100%; font: 16px/1.5 system-ui, sans-serif; }
    article { box-sizing: border-box; min-height: 12rem; height: 100%; padding: 1.25rem; color: #172033; background: #fff; border: 1px solid #c8d1df; border-radius: .75rem; }
    .eyebrow { margin: 0 0 .25rem; color: #526079; font-size: .75rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
    h1 { margin: 0 0 .75rem; } p[role=alert] { color: #b42318; }
  \`,
})
export class WidgetComponent {
  readonly configuration = input<unknown>(DEFAULT_WIDGET_CONFIGURATION);
  protected readonly title = signal(DEFAULT_WIDGET_CONFIGURATION.title);
  protected readonly message = signal<string | null>(null);

  constructor() {
    effect(() => {
      const result = readWidgetConfiguration(this.configuration());
      this.title.set(result.configuration.title);
      this.message.set(result.status === 'invalid' ? result.message : null);
    });
  }
}
`,
    ],
    [
      "src/widget-settings.component.ts",
      `import { Component, ElementRef, effect, inject, input, signal } from '@angular/core';
import { emitWidgetConfigurationChanged } from '@da-da/widget-angular';
import { DEFAULT_WIDGET_CONFIGURATION, readWidgetConfiguration } from './widget-configuration';

@Component({
  selector: 'widget-settings',
  template: \`
    <form (submit)="save($event)" novalidate>
      <label for="widget-title-input">Title</label>
      <input id="widget-title-input" type="text" [value]="draftTitle()" (input)="updateTitle($event)" autocomplete="off" />
      @if (message(); as feedback) { <p role="alert">{{ feedback }}</p> }
      <button type="submit">Save settings</button>
    </form>
  \`,
  styles: \`
    :host { display: block; font: 16px/1.5 system-ui, sans-serif; }
    form { display: grid; gap: .5rem; } input, button { min-height: 2.25rem; border: 1px solid #9aa6ba; border-radius: .375rem; font: inherit; } input { padding: .25rem .5rem; } button { padding: .25rem .75rem; color: #fff; background: #075b67; border-color: #075b67; } p { margin: 0; color: #b42318; }
  \`,
})
export class WidgetSettingsComponent {
  readonly configuration = input<unknown>(DEFAULT_WIDGET_CONFIGURATION);
  protected readonly draftTitle = signal(DEFAULT_WIDGET_CONFIGURATION.title);
  protected readonly message = signal<string | null>(null);
  private readonly hostElement = inject(ElementRef<HTMLElement>);

  constructor() {
    effect(() => {
      const result = readWidgetConfiguration(this.configuration());
      this.draftTitle.set(result.configuration.title);
      this.message.set(result.status === 'invalid' ? result.message : null);
    });
  }

  protected updateTitle(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.draftTitle.set(event.target.value);
      this.message.set(null);
    }
  }

  protected save(event: SubmitEvent): void {
    event.preventDefault();
    const result = readWidgetConfiguration({ title: this.draftTitle() });

    if (result.status === 'invalid') {
      this.message.set(result.message);
      return;
    }

    this.message.set(null);
    emitWidgetConfigurationChanged(this.hostElement.nativeElement, result.configuration);
  }
}
`,
    ],
    [
      "src/main.ts",
      `import { registerAngularWidget } from '@da-da/widget-angular';
import { WidgetComponent } from './widget.component';
import { WidgetSettingsComponent } from './widget-settings.component';
import { ${definitionName}_DEFINITION } from './widget.definition';

void registerAngularWidget({
  definition: ${definitionName}_DEFINITION,
  contentComponent: WidgetComponent,
  settingsComponent: WidgetSettingsComponent,
});
`,
    ],
    [
      "src/widget-configuration.spec.ts",
      `import { readWidgetConfiguration } from './widget-configuration';

describe('readWidgetConfiguration', () => {
  it('returns explicit feedback for an invalid runtime configuration', () => {
    expect(readWidgetConfiguration({ title: '  ' })).toEqual({
      status: 'invalid',
      configuration: { title: ${literal(project.displayName)} },
      message: 'Enter a title.',
    });
  });

  it('returns a complete normalized configuration', () => {
    expect(readWidgetConfiguration({ title: '  My list  ' })).toEqual({
      status: 'valid',
      configuration: { title: 'My list' },
    });
  });
});
`,
    ],
    [
      "src/widget-settings.component.spec.ts",
      `import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { WidgetSettingsComponent } from './widget-settings.component';

describe('WidgetSettingsComponent', () => {
  it('emits a complete validated replacement configuration', async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetSettingsComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    const fixture = TestBed.createComponent(WidgetSettingsComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const input = host.querySelector<HTMLInputElement>('input');
    const form = host.querySelector<HTMLFormElement>('form');
    const changes: CustomEvent<unknown>[] = [];

    if (input === null || form === null) throw new Error('Settings form is missing.');
    host.addEventListener('configuration-changed', (event) => changes.push(event as CustomEvent<unknown>));
    input.value = 'My list';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));

    expect(changes).toHaveSize(1);
    expect(changes[0].detail).toEqual({ title: 'My list' });
  });
});
`,
    ],
    [
      "src/index.html",
      `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title} preview</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root { color: #172033; background: #f3f6fa; font: 16px/1.5 system-ui, sans-serif; }
    body { margin: 0; }
    main { box-sizing: border-box; width: min(100% - 2rem, 72rem); margin: 0 auto; padding: 2rem 0; }
    header { margin-bottom: 1.5rem; }
    h1, h2, p { margin-top: 0; }
    h1 { margin-bottom: .25rem; }
    .preview-grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(18rem, 1fr); gap: 1rem; align-items: start; }
    .preview-panel { min-width: 0; padding: 1rem; background: #fff; border: 1px solid #c8d1df; border-radius: .75rem; }
    .preview-panel h2 { margin-bottom: 1rem; font-size: 1rem; }
    .content-panel { grid-row: span 2; }
    .manifest-url { overflow-wrap: anywhere; }
    pre { overflow: auto; margin: 1rem 0 0; padding: .75rem; color: #d8e3f3; background: #172033; border-radius: .5rem; font: .8rem/1.5 ui-monospace, monospace; white-space: pre-wrap; }
    @media (max-width: 48rem) { .preview-grid { grid-template-columns: 1fr; } .content-panel { grid-row: auto; } }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>${title} preview</h1>
      <p>Content and settings run through the public browser Widget contract.</p>
    </header>
    <div class="preview-grid">
      <section class="preview-panel content-panel" aria-labelledby="content-heading">
        <h2 id="content-heading">Widget content</h2>
        <${project.elementTag}></${project.elementTag}>
      </section>
      <section class="preview-panel" aria-labelledby="settings-heading">
        <h2 id="settings-heading">Widget settings</h2>
        <${project.settingsElementTag}></${project.settingsElementTag}>
      </section>
      <section class="preview-panel" aria-labelledby="manifest-heading">
        <h2 id="manifest-heading">Widget Manifest</h2>
        <a class="manifest-url" id="manifest-url"></a>
        <pre id="manifest-json" aria-live="polite">Loading Manifest…</pre>
      </section>
    </div>
  </main>
  <script>
    const manifestUrl = new URL('/widget-manifest.json', window.location.href).href;
    const manifestLink = document.querySelector('#manifest-url');
    const manifestJson = document.querySelector('#manifest-json');
    manifestLink.href = manifestUrl;
    manifestLink.textContent = manifestUrl;

    Promise.all([
      fetch('/widget-manifest.json').then((response) => {
        if (!response.ok) throw new Error('The Widget Manifest could not be loaded.');
        return response.json();
      }),
      customElements.whenDefined(${literal(project.elementTag)}),
      customElements.whenDefined(${literal(project.settingsElementTag)}),
    ]).then(([manifest]) => {
      const content = document.querySelector(${literal(project.elementTag)});
      const settings = document.querySelector(${literal(project.settingsElementTag)});
      const configuration = manifest.defaultConfiguration;
      manifestJson.textContent = JSON.stringify(manifest, null, 2);
      content.configuration = configuration; settings.configuration = configuration;
      settings.addEventListener('configuration-changed', (event) => { content.configuration = event.detail; settings.configuration = event.detail; });
    }).catch((error) => {
      manifestJson.setAttribute('role', 'alert');
      manifestJson.textContent = error instanceof Error ? error.message : 'The Widget preview could not be started.';
    });
  </script>
</body>
</html>
`,
    ],
    ["scripts/start-widget.mjs", startWidgetScript()],
    ["scripts/write-widget-manifest.mjs", manifestWriter()],
    [
      "scripts/check-built-widget.mjs",
      await readFile(
        new URL("../lib/check-built-widget.mjs", import.meta.url),
        "utf8",
      ),
    ],
    [
      "README.md",
      `# ${project.displayName}\n\nThis independent Angular 20 Widget Project publishes one Widget Type: \`${project.type}\`.\n\nRun \`npm install\`, then:\n\n- \`npm start\` writes and prints http://localhost:4201/widget-manifest.json, then starts the local preview. The development server serves the Manifest and JavaScript module with CORS enabled for installation in a local Dashboard.\n- \`npm test\` runs starter application tests.\n- \`npm run check\` builds and checks the version-two Widget Manifest and browser Custom Element contract.\n- \`npm run build\` produces \`dist/${project.name}/browser/\`, ready for a static host.\n\nInstall the printed Manifest URL in a local Dashboard whose operator has allowlisted \`http://localhost:4201\`. The preview only exercises the content and settings Widget Elements; it does not emulate Dashboard layout, persistence, installation, trust, or Widget Frame controls. If you change Manifest metadata, remove and reinstall the Widget Installation in the Dashboard before testing it.\n\nThe Widget is trusted same-page browser code. Do not place private credentials in it; use an author-owned backend when needed.\n`,
    ],
  ];
}

function angularConfiguration(name) {
  return (
    JSON.stringify(
      {
        $schema: "./node_modules/@angular/cli/lib/config/schema.json",
        version: 1,
        projects: {
          [name]: {
            projectType: "application",
            root: "",
            sourceRoot: "src",
            prefix: "widget",
            architect: {
              build: {
                builder: "@angular/build:application",
                options: {
                  browser: "src/main.ts",
                  index: "src/index.html",
                  tsConfig: "tsconfig.app.json",
                  inlineStyleLanguage: "css",
                  preserveSymlinks: true,
                  assets: [{ glob: "**/*", input: "public" }],
                  styles: [],
                },
                configurations: {
                  production: { outputHashing: "none" },
                  development: {
                    optimization: false,
                    extractLicenses: false,
                    sourceMap: true,
                  },
                },
                defaultConfiguration: "production",
              },
              serve: {
                builder: "@angular/build:dev-server",
                configurations: {
                  production: { buildTarget: `${name}:build:production` },
                  development: { buildTarget: `${name}:build:development` },
                },
                defaultConfiguration: "development",
              },
              test: {
                builder: "@angular/build:karma",
                options: {
                  tsConfig: "tsconfig.spec.json",
                  inlineStyleLanguage: "css",
                  assets: [{ glob: "**/*", input: "public" }],
                  styles: [],
                },
              },
            },
          },
        },
      },
      null,
      2,
    ) + "\n"
  );
}

function typescriptConfiguration() {
  return `${JSON.stringify({ compilerOptions: { strict: true, noImplicitOverride: true, noPropertyAccessFromIndexSignature: true, noImplicitReturns: true, noFallthroughCasesInSwitch: true, skipLibCheck: true, isolatedModules: true, experimentalDecorators: true, importHelpers: true, target: "ES2022", module: "preserve" }, angularCompilerOptions: { enableI18nLegacyMessageIdFormat: false, strictInjectionParameters: true, strictInputAccessModifiers: true, typeCheckHostBindings: true, strictTemplates: true } }, null, 2)}\n`;
}
function applicationTypescriptConfiguration() {
  return `${JSON.stringify({ extends: "./tsconfig.json", compilerOptions: { outDir: "./out-tsc/app", types: [] }, files: ["src/main.ts"], include: ["src/**/*.ts"], exclude: ["src/**/*.spec.ts"] }, null, 2)}\n`;
}
function specTypescriptConfiguration() {
  return `${JSON.stringify({ extends: "./tsconfig.json", compilerOptions: { outDir: "./out-tsc/spec", types: ["jasmine"] }, include: ["src/**/*.ts"] }, null, 2)}\n`;
}
function definitionTypescriptConfiguration() {
  return `${JSON.stringify({ extends: "./tsconfig.json", compilerOptions: { outDir: "./out-tsc/widget-definition", module: "ES2022", moduleResolution: "bundler", types: [] }, files: ["src/widget.definition.ts"] }, null, 2)}\n`;
}

function startWidgetScript() {
  return `import { spawn } from 'node:child_process';

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';

await run(command, ['tsc', '--project', 'tsconfig.definition.json']);
await run(process.execPath, [
  'scripts/write-widget-manifest.mjs',
  'out-tsc/widget-definition/widget.definition.js',
  'public/widget-manifest.json',
]);

console.log('Widget Manifest URL: http://localhost:4201/widget-manifest.json');
const server = spawn(command, [
  'ng',
  'serve',
  '--host',
  'localhost',
  '--port',
  '4201',
  '--headers',
  'Access-Control-Allow-Origin=*',
], { stdio: 'inherit' });
server.once('exit', (code) => { process.exitCode = code ?? 1; });

function run(command, arguments_) {
  return new Promise((resolveRun, rejectRun) => {
    const process = spawn(command, arguments_, { stdio: 'inherit' });
    process.once('error', rejectRun);
    process.once('exit', (code) => code === 0 ? resolveRun() : rejectRun(new Error(\`Command failed: \${command} \${arguments_.join(' ')}\`)));
  });
}
`;
}

function manifestWriter() {
  return `import { mkdir, writeFile } from 'node:fs/promises';\nimport { dirname, resolve } from 'node:path';\nimport { pathToFileURL } from 'node:url';\nimport { validateWidgetManifest } from '@da-da/widget-contract';\n\nexport async function writeWidgetManifest(definition, manifestPath) {\n  const validation = validateWidgetManifest(definition, 'https://widget-author.invalid/widget-manifest.json');\n  if (validation.status !== 'valid') throw new Error(\`Widget definition violates the version-two Widget Manifest contract: \${validation.reason}.\`);\n  await mkdir(dirname(manifestPath), { recursive: true });\n  await writeFile(manifestPath, \`\${JSON.stringify(definition, null, 2)}\\n\`, 'utf8');\n}\n\nconst [definitionPath, manifestPath] = process.argv.slice(2);\nif (definitionPath === undefined || manifestPath === undefined) throw new Error('Usage: node write-widget-manifest.mjs <definition-module> <manifest-path>');\nconst definition = await import(pathToFileURL(resolve(definitionPath)).href);\nawait writeWidgetManifest(definition[Object.keys(definition).find((key) => key.endsWith('_DEFINITION'))], resolve(manifestPath));\n`;
}

function camelCase(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}
function constantName(value) {
  return value
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, letter) => letter.toUpperCase())
    .replace(/^[a-z]/, (letter) => letter.toUpperCase())
    .replace(/[a-z][A-Z]/g, (match) => `${match[0]}_${match[1]}`)
    .toUpperCase();
}
function literal(value) {
  return JSON.stringify(value);
}
function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function usage() {
  return "Usage: create-da-da-widget --name <project-name> --type <widget-type> --display-name <name> --element-tag <tag> --settings-element-tag <tag> --version <version> --width <columns> --height <rows> [--description <text>] [--output <directory>]\\n";
}

const invokedPath =
  process.argv[1] === undefined
    ? undefined
    : await realpath(process.argv[1]).catch(() => resolve(process.argv[1]));

if (
  invokedPath !== undefined &&
  import.meta.url === pathToFileURL(invokedPath).href
) {
  createWidgetProject(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error.message}\\n`);
    process.exitCode = 1;
  });
}
