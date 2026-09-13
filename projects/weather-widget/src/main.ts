import {
  registerAngularWidget,
  type CustomElementRegistryPort,
} from '@da-da/widget-angular';
import { WeatherWidgetSettingsComponent } from './weather-widget-settings.component';
import { WeatherWidgetComponent } from './weather-widget.component';
import { WEATHER_WIDGET_DEFINITION } from './weather-widget.definition';

void registerWeatherWidget();

export async function registerWeatherWidget(
  registry: CustomElementRegistryPort = customElements,
): Promise<void> {
  await registerAngularWidget({
    definition: WEATHER_WIDGET_DEFINITION,
    contentComponent: WeatherWidgetComponent,
    settingsComponent: WeatherWidgetSettingsComponent,
  }, registry);
}
