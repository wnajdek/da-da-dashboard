import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { validateWidgetManifest } from "../../../packages/widget-contract/dist/public-api.js";

const VALIDATION_MANIFEST_URL =
  "https://widget-author.invalid/widget-manifest.json";

export async function writeWidgetManifest(definition, manifestPath) {
  const validation = validateWidgetManifest(
    definition,
    VALIDATION_MANIFEST_URL,
  );

  if (validation.status !== "valid") {
    throw new Error(
      `Weather Widget definition violates the version-two Widget Manifest contract: ${validation.reason}.`,
    );
  }

  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(
    manifestPath,
    `${JSON.stringify(definition, null, 2)}\n`,
    "utf8",
  );
}

async function main() {
  const [definitionPath, manifestPath] = process.argv.slice(2);

  if (definitionPath === undefined || manifestPath === undefined) {
    throw new Error(
      "Usage: node write-widget-manifest.mjs <definition-module> <manifest-path>",
    );
  }

  const definitionModule = await import(
    pathToFileURL(resolve(definitionPath)).href
  );

  await writeWidgetManifest(
    definitionModule.WEATHER_WIDGET_DEFINITION,
    resolve(manifestPath),
  );
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  await main();
}
