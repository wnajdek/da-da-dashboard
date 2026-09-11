import { provideZonelessChangeDetection } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { createWeatherWidgetElement } from './weather-widget-element';
import { WeatherWidgetSettingsComponent } from './weather-widget-settings.component';
import { WeatherWidgetComponent } from './weather-widget.component';

const CONTENT_ELEMENT_TAG = 'sample-weather-widget';
const SETTINGS_ELEMENT_TAG = 'sample-weather-widget-settings';

void registerWeatherWidget();

async function registerWeatherWidget(): Promise<void> {
  if (
    customElements.get(CONTENT_ELEMENT_TAG) !== undefined &&
    customElements.get(SETTINGS_ELEMENT_TAG) !== undefined
  ) {
    return;
  }

  const application = createApplication({
    providers: [provideZonelessChangeDetection()],
  });

  if (customElements.get(CONTENT_ELEMENT_TAG) === undefined) {
    customElements.define(
      CONTENT_ELEMENT_TAG,
      createWeatherWidgetElement(application, WeatherWidgetComponent),
    );
  }

  if (customElements.get(SETTINGS_ELEMENT_TAG) === undefined) {
    customElements.define(
      SETTINGS_ELEMENT_TAG,
      createWeatherWidgetElement(application, WeatherWidgetSettingsComponent),
    );
  }
}
