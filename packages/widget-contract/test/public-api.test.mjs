import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SUPPORTED_WIDGET_MANIFEST_VERSION,
  decodeJsonObject,
  validateWidgetManifest,
} from '../dist/public-api.js';

const manifestUrl = 'https://widgets.example.test/weather/manifest.json';

test('validates and normalizes a version-two Widget Manifest', () => {
  const result = validateWidgetManifest(
    {
      manifestVersion: SUPPORTED_WIDGET_MANIFEST_VERSION,
      type: 'weather',
      displayName: '  Weather  ',
      version: ' 1.0.0 ',
      elementTag: 'trusted-weather-widget',
      settingsElementTag: 'trusted-weather-widget-settings',
      entryBundleUrl: '../entry.js#ignored',
      defaultConfiguration: { location: 'Warsaw', units: 'metric' },
      preferredLayout: { w: 4, h: 3 },
    },
    manifestUrl,
  );

  assert.deepEqual(result, {
    status: 'valid',
    manifest: {
      manifestVersion: 2,
      type: 'weather',
      displayName: 'Weather',
      version: '1.0.0',
      elementTag: 'trusted-weather-widget',
      settingsElementTag: 'trusted-weather-widget-settings',
      entryBundleUrl: 'https://widgets.example.test/entry.js',
      defaultConfiguration: { location: 'Warsaw', units: 'metric' },
      preferredLayout: { w: 4, h: 3 },
    },
  });
});

test('rejects unsupported and unsafe Manifest boundary values', () => {
  assert.deepEqual(
    validateWidgetManifest(
      { manifestVersion: SUPPORTED_WIDGET_MANIFEST_VERSION + 1 },
      manifestUrl,
    ),
    { status: 'invalid', reason: 'unsupported-version' },
  );
  assert.deepEqual(
    validateWidgetManifest(
      {
        manifestVersion: 2,
        type: 'weather',
        displayName: 'Weather',
        version: '1.0.0',
        elementTag: 'trusted-weather-widget',
        settingsElementTag: 'trusted-weather-widget-settings',
        entryBundleUrl: 'https://cdn.example.test/entry.js',
        defaultConfiguration: {},
        preferredLayout: { w: 4, h: 3 },
      },
      manifestUrl,
    ),
    { status: 'invalid', reason: 'untrusted-entry-bundle' },
  );
  assert.equal(decodeJsonObject({ value: Number.NaN }), null);
  assert.equal(decodeJsonObject({ value: new Date() }), null);
});
