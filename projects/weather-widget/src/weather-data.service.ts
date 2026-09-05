import { InjectionToken } from '@angular/core';
import type {
  WeatherConditions,
  WeatherConfiguration,
} from './weather-widget.models';
import { isRecord } from './weather-guards';

export interface WeatherDataSource {
  read(configuration: WeatherConfiguration): Promise<WeatherConditions>;
}

export const WEATHER_DATA_SOURCE = new InjectionToken<WeatherDataSource>(
  'Weather data source',
  {
    providedIn: 'root',
    factory: () => browserWeatherDataSource,
  },
);

const browserWeatherDataSource: WeatherDataSource = {
  async read(configuration): Promise<WeatherConditions> {
    const requestConfiguration = readRequestConfiguration(configuration);
    const location = encodeURIComponent(requestConfiguration.location);
    const geocodingResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${location}&count=1&language=en&format=json`,
    );

    const geocoding = await readJson(
      geocodingResponse,
      'Location lookup failed.',
      'Location lookup returned invalid data.',
    );
    const result = readGeocodingResult(geocoding);

    if (result === null) {
      throw new Error('Location was not found.');
    }

    const temperatureUnit =
      requestConfiguration.units === 'imperial' ? 'fahrenheit' : 'celsius';
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${result.latitude}&longitude=${result.longitude}&current=temperature_2m,relative_humidity_2m,weather_code&temperature_unit=${temperatureUnit}`,
    );

    const weather = await readJson(
      weatherResponse,
      'Weather lookup failed.',
      'Weather lookup returned invalid data.',
    );
    const current = readCurrentConditions(weather);

    if (current === null) {
      throw new Error('Weather data was invalid.');
    }

    return {
      location: result.name,
      ...current,
      temperatureUnit: requestConfiguration.units === 'imperial' ? '°F' : '°C',
    };
  },
};

async function readJson(
  response: Response,
  requestFailureMessage: string,
  invalidDataMessage: string,
): Promise<unknown> {
  if (!response.ok) {
    throw new Error(requestFailureMessage);
  }

  try {
    return (await response.json()) as unknown;
  } catch {
    throw new Error(invalidDataMessage);
  }
}

function readRequestConfiguration(
  configuration: WeatherConfiguration,
): WeatherConfiguration {
  const location =
    typeof configuration.location === 'string'
      ? configuration.location.trim()
      : '';

  if (location.length === 0) {
    throw new Error('Location is required.');
  }

  if (configuration.units !== 'metric' && configuration.units !== 'imperial') {
    throw new Error('Weather units are invalid.');
  }

  return { location, units: configuration.units };
}

function readGeocodingResult(
  value: unknown,
): { name: string; latitude: number; longitude: number } | null {
  if (!isRecord(value) || !Array.isArray(value['results'])) {
    return null;
  }

  const first = value['results'][0];

  if (
    !isRecord(first) ||
    !isNonEmptyString(first['name']) ||
    !isLatitude(first['latitude']) ||
    !isLongitude(first['longitude'])
  ) {
    return null;
  }

  return {
    name: first['name'].trim(),
    latitude: first['latitude'],
    longitude: first['longitude'],
  };
}

function readCurrentConditions(
  value: unknown,
): Omit<WeatherConditions, 'location' | 'temperatureUnit'> | null {
  if (!isRecord(value) || !isRecord(value['current'])) {
    return null;
  }

  const current = value['current'];

  if (
    !isFiniteNumber(current['temperature_2m']) ||
    !isPercentage(current['relative_humidity_2m']) ||
    !isWeatherCode(current['weather_code'])
  ) {
    return null;
  }

  return {
    temperature: current['temperature_2m'],
    humidity: current['relative_humidity_2m'],
    weatherCode: current['weather_code'],
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isLatitude(value: unknown): value is number {
  return isFiniteNumber(value) && value >= -90 && value <= 90;
}

function isLongitude(value: unknown): value is number {
  return isFiniteNumber(value) && value >= -180 && value <= 180;
}

function isPercentage(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0 && value <= 100;
}

function isWeatherCode(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 99
  );
}
