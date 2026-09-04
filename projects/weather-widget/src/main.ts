import { provideZonelessChangeDetection } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { createWeatherWidgetElement } from './weather-widget-element';

void registerWeatherWidget();

async function registerWeatherWidget(): Promise<void> {
  const application = createApplication({
    providers: [provideZonelessChangeDetection()],
  });

  if (customElements.get('trusted-weather-widget') !== undefined) {
    return;
  }

  customElements.define(
    'trusted-weather-widget',
    createWeatherWidgetElement(application),
  );
}
