import {
  SUPPORTED_WIDGET_MANIFEST_VERSION,
  validateWidgetManifest,
} from './widget-manifest';

describe('validateWidgetManifest', () => {
  it('normalizes a valid manifest into the host installation shape', () => {
    const defaultConfiguration = { location: 'Warsaw', units: 'metric' };
    const result = validateWidgetManifest(
      {
        manifestVersion: SUPPORTED_WIDGET_MANIFEST_VERSION,
        type: 'weather',
        displayName: '  Weather  ',
        description: '  Current conditions  ',
        version: ' 1.0.0 ',
        elementTag: 'trusted-weather-widget',
        entryBundleUrl: '../entry.js#ignored',
        defaultConfiguration,
        preferredLayout: { w: 4, h: 3 },
      },
      'https://widgets.example.test/weather/manifest.json#ignored',
    );

    expect(result.status).toBe('valid');

    if (result.status !== 'valid') {
      return;
    }

    expect(result.manifest.manifestVersion).toBe(1);
    expect(result.manifest.type).toBe('weather');
    expect(result.manifest.displayName).toBe('Weather');
    expect(result.manifest.description).toBe('Current conditions');
    expect(result.manifest.version).toBe('1.0.0');
    expect(result.manifest.elementTag).toBe('trusted-weather-widget');
    expect(result.manifest.entryBundleUrl).toBe(
      'https://widgets.example.test/entry.js',
    );
    expect(result.manifest.defaultConfiguration as unknown).toEqual({
      location: 'Warsaw',
      units: 'metric',
    });

    defaultConfiguration.location = 'Changed after validation';
    expect(result.manifest.defaultConfiguration as unknown).toEqual({
      location: 'Warsaw',
      units: 'metric',
    });
    expect(result.manifest.preferredLayout).toEqual({ w: 4, h: 3 });
  });

  it('distinguishes unsupported manifest versions from malformed manifests', () => {
    expect(
      validateWidgetManifest(
        { manifestVersion: SUPPORTED_WIDGET_MANIFEST_VERSION + 1 },
        'https://widgets.example.test/manifest.json',
      ),
    ).toEqual({ status: 'invalid', reason: 'unsupported-version' });

    expect(
      validateWidgetManifest(
        { manifestVersion: '1' },
        'https://widgets.example.test/manifest.json',
      ),
    ).toEqual({ status: 'invalid', reason: 'invalid' });
  });

  it('rejects invalid element metadata and non-JSON configuration', () => {
    expect(
      validateWidgetManifest(
        {
          manifestVersion: 1,
          type: 'weather',
          displayName: 'Weather',
          version: '1.0.0',
          elementTag: 'weather-widget',
          entryBundleUrl: './entry.js',
          defaultConfiguration: { location: new Date() },
          preferredLayout: { w: 4, h: 3 },
        },
        'https://widgets.example.test/manifest.json',
      ),
    ).toEqual({ status: 'invalid', reason: 'invalid' });
  });

  it('rejects an entry bundle from a different origin', () => {
    expect(
      validateWidgetManifest(
        {
          manifestVersion: 1,
          type: 'weather',
          displayName: 'Weather',
          version: '1.0.0',
          elementTag: 'trusted-weather-widget',
          entryBundleUrl: 'https://cdn.example.test/entry.js',
          defaultConfiguration: {},
          preferredLayout: { w: 4, h: 3 },
        },
        'https://widgets.example.test/manifest.json',
      ),
    ).toEqual({ status: 'invalid', reason: 'untrusted-entry-bundle' });
  });
});
