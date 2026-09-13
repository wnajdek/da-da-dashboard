import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { inspectBuildOutput } from './check-built-widget.mjs';

const VALID_MANIFEST = {
  manifestVersion: 2,
  type: 'weather',
  displayName: 'Weather',
  version: '1.0.0',
  elementTag: 'sample-weather-widget',
  settingsElementTag: 'sample-weather-widget-settings',
  entryBundleUrl: './main.js',
  defaultConfiguration: { location: 'Cracow', units: 'metric' },
  preferredLayout: { w: 4, h: 3 },
};

test('identifies the Manifest field that violates the version-two contract', async () => {
  const outputDirectory = await createBuildOutput({
    ...VALID_MANIFEST,
    manifestVersion: 1,
  });

  await assert.rejects(
    inspectBuildOutput(outputDirectory),
    /Manifest field "manifestVersion" violates the version-two Widget contract/,
  );
});

test('identifies the declared entry bundle when it is absent from the output', async () => {
  const outputDirectory = await createBuildOutput(VALID_MANIFEST);

  await assert.rejects(
    inspectBuildOutput(outputDirectory),
    /Manifest field "entryBundleUrl" declares "\.\/main\.js", but that bundle is absent/,
  );
});

test('identifies the invalid Manifest field instead of returning a generic failure', async () => {
  const outputDirectory = await createBuildOutput({
    ...VALID_MANIFEST,
    displayName: '',
  });
  await writeFile(join(outputDirectory, 'main.js'), 'export {};');

  await assert.rejects(
    inspectBuildOutput(outputDirectory),
    /Manifest field "displayName" violates the version-two Widget contract/,
  );
});

test('identifies an invalid Manifest root instead of throwing a generic error', async () => {
  const outputDirectory = await createBuildOutput(null);

  await assert.rejects(
    inspectBuildOutput(outputDirectory),
    /Manifest field "root" violates the version-two Widget contract/,
  );
});

async function createBuildOutput(manifest) {
  const outputDirectory = await mkdtemp(join(tmpdir(), 'weather-widget-check-'));
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(
    join(outputDirectory, 'widget-manifest.json'),
    JSON.stringify(manifest),
  );
  return outputDirectory;
}
