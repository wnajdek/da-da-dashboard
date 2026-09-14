import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateWidgetManifest } from '@da-da/widget-contract';

export async function writeWidgetManifest(definition, manifestPath) {
  const validation = validateWidgetManifest(definition, 'https://widget-author.invalid/widget-manifest.json');
  if (validation.status !== 'valid') throw new Error(`Widget definition violates the version-two Widget Manifest contract: ${validation.reason}.`);
  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(definition, null, 2)}\n`, 'utf8');
}

const [definitionPath, manifestPath] = process.argv.slice(2);
if (definitionPath === undefined || manifestPath === undefined) throw new Error('Usage: node write-widget-manifest.mjs <definition-module> <manifest-path>');
const definition = await import(pathToFileURL(resolve(definitionPath)).href);
await writeWidgetManifest(definition[Object.keys(definition).find((key) => key.endsWith('_DEFINITION'))], resolve(manifestPath));
