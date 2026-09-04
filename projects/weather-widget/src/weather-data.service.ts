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
    const location = encodeURIComponent(configuration.location);
    const geocodingResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${location}&count=1&language=en&format=json`,
    );

    if (!geocodingResponse.ok) {
      throw new Error('Location lookup failed.');
    }

    const geocoding = (await geocodingResponse.json()) as unknown;
    const result = readGeocodingResult(geocoding);

    if (result === null) {
      throw new Error('Location was not found.');
    }

    const temperatureUnit =
      configuration.units === 'imperial' ? 'fahrenheit' : 'celsius';
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${result.latitude}&longitude=${result.longitude}&current=temperature_2m,relative_humidity_2m,weather_code&temperature_unit=${temperatureUnit}`,
    );

    if (!weatherResponse.ok) {
      throw new Error('Weather lookup failed.');
    }

    const weather = (await weatherResponse.json()) as unknown;
    const current = readCurrentConditions(weather);

    if (current === null) {
      throw new Error('Weather data was invalid.');
    }

    return {
      location: result.name,
      ...current,
      temperatureUnit: configuration.units === 'imperial' ? '°F' : '°C',
    };
  },
};

function readGeocodingResult(
  value: unknown,
): { name: string; latitude: number; longitude: number } | null {
  if (!isRecord(value) || !Array.isArray(value['results'])) {
    return null;
  }

  const first = value['results'][0];

  if (
    !isRecord(first) ||
    typeof first['name'] !== 'string' ||
    !isFiniteNumber(first['latitude']) ||
    !isFiniteNumber(first['longitude'])
  ) {
    return null;
  }

  return {
    name: first['name'],
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
    !isFiniteNumber(current['relative_humidity_2m']) ||
    !isFiniteNumber(current['weather_code'])
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
