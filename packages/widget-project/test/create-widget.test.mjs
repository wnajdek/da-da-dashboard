import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, test } from "node:test";
import { spawnSync } from "node:child_process";

const createdDirectories = [];
const generatorPath = fileURLToPath(
  new URL("../bin/create-widget.mjs", import.meta.url),
);

afterEach(async () => {
  await Promise.all(
    createdDirectories.splice(0).map((directory) =>
      rm(directory, {
        force: true,
        recursive: true,
      }),
    ),
  );
});

test("creates an Angular Widget Project from command-line values", async () => {
  const workspace = await createWorkspace();
  const output = join(workspace, "reading-list");

  const result = runGenerator(
    "--name",
    "reading-list",
    "--type",
    "reading-list",
    "--display-name",
    "Reading list",
    "--description",
    "Books to read next",
    "--element-tag",
    "example-reading-list",
    "--settings-element-tag",
    "example-reading-list-settings",
    "--version",
    "1.2.3",
    "--width",
    "3",
    "--height",
    "2",
    "--output",
    output,
  );

  assert.equal(result.status, 0, result.stderr);

  const definition = await readFile(
    join(output, "src/widget.definition.ts"),
    "utf8",
  );
  const configuration = await readFile(
    join(output, "src/widget-configuration.ts"),
    "utf8",
  );
  const packageJson = JSON.parse(
    await readFile(join(output, "package.json"), "utf8"),
  );
  const settings = await readFile(
    join(output, "src/widget-settings.component.ts"),
    "utf8",
  );
  const checker = await readFile(
    join(output, "scripts/check-built-widget.mjs"),
    "utf8",
  );
  const startScript = await readFile(
    join(output, "scripts/start-widget.mjs"),
    "utf8",
  );
  const preview = await readFile(join(output, "src/index.html"), "utf8");
  const readme = await readFile(join(output, "README.md"), "utf8");

  assert.match(definition, /type: "reading-list"/);
  assert.match(definition, /elementTag: "example-reading-list"/);
  assert.match(definition, /preferredLayout: \{ w: 3, h: 2 \}/);
  assert.match(configuration, /readWidgetConfiguration/);
  assert.match(settings, /emitWidgetConfigurationChanged/);
  assert.equal(
    packageJson.scripts.check.includes("check-built-widget.mjs"),
    true,
  );
  assert.match(packageJson.scripts.test, /CHROME_BIN/);
  assert.equal(packageJson.scripts.start, "node scripts/start-widget.mjs");
  assert.match(startScript, /widget-manifest\.json/);
  assert.match(startScript, /http:\/\/localhost:4201\/widget-manifest\.json/);
  assert.match(startScript, /--headers/);
  assert.match(startScript, /Access-Control-Allow-Origin/);
  assert.match(preview, /customElements\.whenDefined/);
  assert.match(preview, /content\.configuration = configuration/);
  assert.match(preview, /settings\.configuration = configuration/);
  assert.match(preview, /configuration-changed/);
  assert.match(preview, /content\.configuration = event\.detail/);
  assert.match(preview, /settings\.configuration = event\.detail/);
  assert.match(readme, /remove and reinstall/i);
  assert.doesNotMatch(
    `${definition}\n${configuration}\n${settings}\n${checker}`,
    /weather/i,
  );
  assert.doesNotMatch(
    `${definition}\n${configuration}\n${settings}\n${checker}`,
    /dashboard\/src/,
  );
});

test("rejects invalid values before creating a partial Widget Project", async () => {
  const workspace = await createWorkspace();
  const output = join(workspace, "invalid-widget");

  const result = runGenerator(
    "--name",
    "invalid-widget",
    "--type",
    "invalid widget",
    "--display-name",
    "Invalid Widget",
    "--element-tag",
    "example-invalid-widget",
    "--settings-element-tag",
    "example-invalid-widget-settings",
    "--version",
    "1.0.0",
    "--width",
    "3",
    "--height",
    "2",
    "--output",
    output,
  );

  assert.notEqual(result.status, 0);
  await assert.rejects(readFile(join(output, "package.json")));
});

test("rejects unsupported layout sizes and invalid semantic versions before generation", async () => {
  const workspace = await createWorkspace();

  for (const [name, option, value] of [
    ["too-wide", "--width", "13"],
    ["invalid-version", "--version", "01.0.0"],
  ]) {
    const output = join(workspace, name);
    const result = runGenerator(
      "--name",
      name,
      "--type",
      name,
      "--display-name",
      "Example Widget",
      "--element-tag",
      `example-${name}`,
      "--settings-element-tag",
      `example-${name}-settings`,
      "--version",
      option === "--version" ? value : "1.0.0",
      "--width",
      option === "--width" ? value : "3",
      "--height",
      "2",
      "--output",
      output,
    );

    assert.notEqual(result.status, 0);
    await assert.rejects(readFile(join(output, "package.json")));
  }
});

test("refuses a rerun without overwriting author application code", async () => {
  const workspace = await createWorkspace();
  const output = join(workspace, "reading-list");
  const arguments_ = [
    "--name",
    "reading-list",
    "--type",
    "reading-list",
    "--display-name",
    "Reading list",
    "--element-tag",
    "example-reading-list",
    "--settings-element-tag",
    "example-reading-list-settings",
    "--version",
    "1.0.0",
    "--width",
    "3",
    "--height",
    "2",
    "--output",
    output,
  ];

  assert.equal(runGenerator(...arguments_).status, 0);
  const authorFile = join(output, "src/author-note.ts");
  await writeFile(authorFile, "export const authorNote = true;\n");

  const result = runGenerator(...arguments_);

  assert.notEqual(result.status, 0);
  assert.equal(
    await readFile(authorFile, "utf8"),
    "export const authorNote = true;\n",
  );
});

function runGenerator(...arguments_) {
  return spawnSync(process.execPath, [generatorPath, ...arguments_], {
    encoding: "utf8",
  });
}

async function createWorkspace() {
  const workspace = await mkdtemp(join(tmpdir(), "widget-project-"));
  createdDirectories.push(workspace);
  return workspace;
}
