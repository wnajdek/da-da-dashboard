import type { WidgetManifest } from '@da-da/widget-contract';

export const WEATHER_WIDGET_DEFINITION = {
  manifestVersion: 2,
  type: 'weather',
  displayName: 'Weather',
  description: 'Current conditions for a saved location',
  version: '1.0.0',
  elementTag: 'sample-weather-widget',
  settingsElementTag: 'sample-weather-widget-settings',
  entryBundleUrl: './main.js',
  defaultConfiguration: {
    location: 'Cracow',
    units: 'metric',
  },
  preferredLayout: {
    w: 4,
    h: 3,
  },
} as const satisfies WidgetManifest;
