import type {
  WeatherConfiguration,
  WeatherUnits,
} from './weather-widget.models';
import { isRecord } from './weather-guards';

export const DEFAULT_WEATHER_CONFIGURATION: WeatherConfiguration = {
  location: 'Cracow',
  units: 'metric',
};

export type WeatherConfigurationReadResult =
  | { readonly status: 'valid'; readonly configuration: WeatherConfiguration }
  | {
      readonly status: 'invalid';
      readonly location: string;
      readonly units: WeatherUnits;
      readonly message: string;
    };

export function readWeatherConfiguration(
  value: unknown,
): WeatherConfigurationReadResult {
  if (!isRecord(value)) {
    return {
      status: 'invalid',
      location: DEFAULT_WEATHER_CONFIGURATION.location,
      units: DEFAULT_WEATHER_CONFIGURATION.units,
      message: 'Enter a valid location and choose a unit.',
    };
  }

  const location =
    typeof value['location'] === 'string' ? value['location'].trim() : '';
  const units = isWeatherUnits(value['units'])
    ? value['units']
    : DEFAULT_WEATHER_CONFIGURATION.units;

  if (location.length === 0) {
    return {
      status: 'invalid',
      location,
      units,
      message: 'Enter a location.',
    };
  }

  if (!isWeatherUnits(value['units'])) {
    return {
      status: 'invalid',
      location,
      units,
      message: 'Choose Celsius or Fahrenheit.',
    };
  }

  return { status: 'valid', configuration: { location, units } };
}

export function isWeatherUnits(value: unknown): value is WeatherUnits {
  return value === 'metric' || value === 'imperial';
}

export function areWeatherConfigurationsEqual(
  left: WeatherConfiguration,
  right: WeatherConfiguration,
): boolean {
  return left.location === right.location && left.units === right.units;
}
