import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { WEATHER_DATA_SOURCE } from '../../../projects/weather-widget/src/weather-data.service';

describe('WeatherDataSource', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  it('resolves a location and reads current conditions from the weather provider', async () => {
    const fetchSpy = spyOn(window, 'fetch').and.returnValues(
      Promise.resolve(
        jsonResponse({
          results: [
            {
              name: 'Warsaw',
              latitude: 52.2297,
              longitude: 21.0122,
            },
          ],
        }),
      ),
      Promise.resolve(
        jsonResponse({
          current: {
            temperature_2m: 70.2,
            relative_humidity_2m: 51,
            weather_code: 3,
          },
        }),
      ),
    );

    const conditions = await TestBed.inject(WEATHER_DATA_SOURCE).read({
      location: 'Warsaw',
      units: 'imperial',
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.calls.argsFor(0)[0]).toBe(
      'https://geocoding-api.open-meteo.com/v1/search?name=Warsaw&count=1&language=en&format=json',
    );
    expect(fetchSpy.calls.argsFor(1)[0]).toBe(
      'https://api.open-meteo.com/v1/forecast?latitude=52.2297&longitude=21.0122&current=temperature_2m,relative_humidity_2m,weather_code&temperature_unit=fahrenheit',
    );
    expect(conditions).toEqual({
      location: 'Warsaw',
      temperature: 70.2,
      temperatureUnit: '°F',
      humidity: 51,
      weatherCode: 3,
    });
  });

  it('rejects invalid geocoding data before requesting weather conditions', async () => {
    const fetchSpy = spyOn(window, 'fetch').and.resolveTo(
      jsonResponse({
        results: [
          {
            name: '',
            latitude: 95,
            longitude: 21.0122,
          },
        ],
      }),
    );

    await expectAsync(
      TestBed.inject(WEATHER_DATA_SOURCE).read({
        location: 'Warsaw',
        units: 'metric',
      }),
    ).toBeRejectedWithError('Location was not found.');

    expect(fetchSpy).toHaveBeenCalledOnceWith(
      'https://geocoding-api.open-meteo.com/v1/search?name=Warsaw&count=1&language=en&format=json',
    );
  });
});

function jsonResponse(value: unknown, ok = true): Response {
  return {
    ok,
    json: () => Promise.resolve(value),
  } as Response;
}
