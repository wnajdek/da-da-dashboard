export type WeatherUnits = 'metric' | 'imperial';

export interface WeatherConfiguration {
  readonly [key: string]: string;
  readonly location: string;
  readonly units: WeatherUnits;
}

export interface WeatherConditions {
  readonly location: string;
  readonly temperature: number;
  readonly temperatureUnit: string;
  readonly humidity: number;
  readonly weatherCode: number;
}
