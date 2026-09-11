import { provideZonelessChangeDetection } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { createWeatherWidgetElement } from './weather-widget-element';
import { WeatherWidgetSettingsComponent } from './weather-widget-settings.component';
import { WeatherWidgetComponent } from './weather-widget.component';

const CONTENT_ELEMENT_TAG = 'sample-weather-widget';
const SETTINGS_ELEMENT_TAG = 'sample-weather-widget-settings';

void registerWeatherWidget();

interface CustomElementRegistryPort {
  get(name: string): CustomElementConstructor | undefined;
  define(name: string, constructor: CustomElementConstructor): void;
}

export async function registerWeatherWidget(
  registry: CustomElementRegistryPort = customElements,
): Promise<void> {
  if (
    registry.get(CONTENT_ELEMENT_TAG) !== undefined ||
    registry.get(SETTINGS_ELEMENT_TAG) !== undefined
  ) {
    throw new Error('Weather widget element tags are already registered.');
  }

  const application = createApplication({
    providers: [provideZonelessChangeDetection()],
  });

  registry.define(
    CONTENT_ELEMENT_TAG,
    createWeatherWidgetElement(application, WeatherWidgetComponent),
  );
  registry.define(
    SETTINGS_ELEMENT_TAG,
    createWeatherWidgetElement(application, WeatherWidgetSettingsComponent),
  );
}
