import { Component, effect, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { WEATHER_DATA_SOURCE } from './weather-data.service';
import type {
  WeatherConditions,
  WeatherConfiguration,
} from './weather-widget.models';
import {
  areWeatherConfigurationsEqual,
  DEFAULT_WEATHER_CONFIGURATION,
  readWeatherConfiguration,
  WeatherConfigurationReadResult,
} from './weather-configuration';

@Component({
  selector: 'weather-widget-view',
  imports: [DecimalPipe],
  template: `
    <article class="weather-widget">
      <header>
        <p class="eyebrow">Weather</p>
        <h1>Local conditions</h1>
      </header>

      <section class="conditions" aria-live="polite">
        @if (weatherState() === 'loading') {
          <p class="status">Loading current conditions…</p>
        } @else if (weatherState() === 'invalid') {
          <p class="status status--validation" role="alert">
            {{ validationMessage() ?? 'Enter valid settings to load weather.' }}
          </p>
        } @else if (weatherState() === 'error') {
          <p class="status status--error" role="alert">
            Weather data could not be loaded. Check the location and try again.
          </p>
        } @else if (conditions(); as current) {
          <h2>{{ current.location }}</h2>
          <p class="temperature">
            {{ current.temperature | number: '1.0-1'
            }}{{ current.temperatureUnit }}
          </p>
          <p class="details">
            Humidity {{ current.humidity | number: '1.0-0' }}%
          </p>
          <p class="details">Weather code {{ current.weatherCode }}</p>
        }
      </section>
    </article>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    .weather-widget {
      box-sizing: border-box;
      min-height: 13rem;
      height: 100%;
      padding: 1.25rem;
      color: #172033;
      background: #fff;
      border: 1px solid #d9e0ea;
      border-radius: 0.75rem;
      font:
        16px/1.4 Inter,
        system-ui,
        sans-serif;
    }
    header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 1rem;
    }
    h1,
    h2,
    p {
      margin-top: 0;
    }
    h1 {
      margin-bottom: 1rem;
      font-size: 1.2rem;
    }
    h2 {
      margin-bottom: 0.25rem;
      font-size: 1.1rem;
    }
    .eyebrow {
      margin-bottom: 0.25rem;
      color: #526079;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .conditions {
      margin-top: 1.3rem;
    }
    .status,
    .details {
      color: #526079;
    }
    .status--error {
      color: #b42318;
    }
    .status--validation {
      color: #b54708;
    }
    .temperature {
      margin-bottom: 0.1rem;
      color: #075b67;
      font-size: 2rem;
      font-weight: 700;
    }
    .details {
      margin-bottom: 0.2rem;
    }
  `,
})
export class WeatherWidgetComponent {
  readonly configuration = input<unknown>(DEFAULT_WEATHER_CONFIGURATION);

  protected readonly validationMessage = signal<string | null>(null);
  protected readonly weatherState = signal<
    'loading' | 'ready' | 'invalid' | 'error'
  >('loading');
  protected readonly conditions = signal<WeatherConditions | null>(null);
  private readonly weatherData = inject(WEATHER_DATA_SOURCE);
  private requestRevision = 0;
  private lastRequestedConfiguration: WeatherConfiguration | null = null;

  constructor() {
    effect(() => {
      const result = readWeatherConfiguration(this.configuration());

      if (result.status === 'invalid') {
        this.showInvalidConfiguration(result);
        return;
      }

      this.applyConfiguration(result.configuration);
    });
  }

  private applyConfiguration(configuration: WeatherConfiguration): void {
    if (
      this.lastRequestedConfiguration !== null &&
      areWeatherConfigurationsEqual(
        configuration,
        this.lastRequestedConfiguration,
      )
    ) {
      return;
    }

    this.lastRequestedConfiguration = configuration;
    this.validationMessage.set(null);
    this.conditions.set(null);
    this.weatherState.set('loading');
    const revision = ++this.requestRevision;
    let weatherRequest: Promise<WeatherConditions>;

    try {
      weatherRequest = this.weatherData.read(configuration);
    } catch {
      if (revision === this.requestRevision) {
        this.weatherState.set('error');
      }
      return;
    }

    void Promise.resolve(weatherRequest).then(
      (conditions) => {
        if (revision === this.requestRevision) {
          this.conditions.set(conditions);
          this.weatherState.set('ready');
        }
      },
      () => {
        if (revision === this.requestRevision) {
          this.conditions.set(null);
          this.weatherState.set('error');
        }
      },
    );
  }

  private showInvalidConfiguration(result: InvalidConfiguration): void {
    this.requestRevision += 1;
    this.lastRequestedConfiguration = null;
    this.validationMessage.set(result.message);
    this.conditions.set(null);
    this.weatherState.set('invalid');
  }
}

type InvalidConfiguration = Extract<
  WeatherConfigurationReadResult,
  { readonly status: 'invalid' }
>;
