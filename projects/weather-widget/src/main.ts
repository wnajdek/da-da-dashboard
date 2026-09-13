import { provideZonelessChangeDetection } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { createWeatherWidgetElement } from './weather-widget-element';
import { WeatherWidgetSettingsComponent } from './weather-widget-settings.component';
import { WeatherWidgetComponent } from './weather-widget.component';
import { WEATHER_WIDGET_DEFINITION } from './weather-widget.definition';

void registerWeatherWidget();

interface CustomElementRegistryPort {
  get(name: string): CustomElementConstructor | undefined;
  define(name: string, constructor: CustomElementConstructor): void;
}

export async function registerWeatherWidget(
  registry: CustomElementRegistryPort = customElements,
): Promise<void> {
  if (
    registry.get(WEATHER_WIDGET_DEFINITION.elementTag) !== undefined ||
    registry.get(WEATHER_WIDGET_DEFINITION.settingsElementTag) !== undefined
  ) {
    throw new Error('Weather widget element tags are already registered.');
  }

  const application = createApplication({
    providers: [provideZonelessChangeDetection()],
  });

  registry.define(
    WEATHER_WIDGET_DEFINITION.elementTag,
    createWeatherWidgetElement(application, WeatherWidgetComponent),
  );
  registry.define(
    WEATHER_WIDGET_DEFINITION.settingsElementTag,
    createWeatherWidgetElement(application, WeatherWidgetSettingsComponent),
  );
}
