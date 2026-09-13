import { validateWidgetManifest } from '@da-da/widget-contract';
import { WEATHER_WIDGET_DEFINITION } from './weather-widget.definition';

describe('WEATHER_WIDGET_DEFINITION', () => {
  it('publishes a version-two Manifest accepted by the Widget contract', () => {
    expect(
      validateWidgetManifest(
        WEATHER_WIDGET_DEFINITION,
        'https://widgets.example.test/weather/widget-manifest.json',
      ),
    ).toEqual({
      status: 'valid',
      manifest: {
        ...WEATHER_WIDGET_DEFINITION,
        entryBundleUrl: 'https://widgets.example.test/weather/main.js',
      },
    });
  });
});
