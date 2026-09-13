import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { WEATHER_WIDGET_DEFINITION } from "../../../out-tsc/weather-widget-definition/projects/weather-widget/src/weather-widget.definition.js";
import { writeWidgetManifest } from "./write-widget-manifest.mjs";

test("writes a deterministic deployable Manifest from the Weather definition", async () => {
  const outputDirectory = await mkdtemp(join(tmpdir(), "weather-widget-"));
  const manifestPath = join(outputDirectory, "widget-manifest.json");

  try {
    await writeWidgetManifest(WEATHER_WIDGET_DEFINITION, manifestPath);

    assert.equal(
      await readFile(manifestPath, "utf8"),
      `${JSON.stringify(WEATHER_WIDGET_DEFINITION, null, 2)}\n`,
    );
  } finally {
    await rm(outputDirectory, { recursive: true, force: true });
  }
});

test("rejects a definition that violates the version-two Manifest contract", async () => {
  const outputDirectory = await mkdtemp(join(tmpdir(), "weather-widget-"));

  try {
    await assert.rejects(
      writeWidgetManifest(
        { ...WEATHER_WIDGET_DEFINITION, elementTag: "weather" },
        join(outputDirectory, "widget-manifest.json"),
      ),
      /violates the version-two Widget Manifest contract: invalid/,
    );
  } finally {
    await rm(outputDirectory, { recursive: true, force: true });
  }
});
