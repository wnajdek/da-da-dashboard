import {
  Component,
  ElementRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { WEATHER_DATA_SOURCE } from './weather-data.service';
import type {
  WeatherConditions,
  WeatherConfiguration,
  WeatherUnits,
} from './weather-widget.models';
import { isRecord } from './weather-guards';

const DEFAULT_CONFIGURATION: WeatherConfiguration = {
  location: 'Warsaw',
  units: 'metric',
};

@Component({
  selector: 'weather-widget-view',
  imports: [DecimalPipe],
  template: `
    <article class="weather-widget">
      <header>
        <p class="eyebrow">Weather</p>
        <h1>Local conditions</h1>
      </header>

      <form (submit)="saveSettings($event)" novalidate>
        <label>
          Location
          <input
            type="text"
            [value]="draftLocation()"
            (input)="updateLocation($event)"
            autocomplete="address-level2"
          />
        </label>
        <label>
          Units
          <select [value]="draftUnits()" (change)="updateUnits($event)">
            <option value="metric">Celsius</option>
            <option value="imperial">Fahrenheit</option>
          </select>
        </label>
        @if (validationMessage(); as message) {
          <p class="validation" role="alert">{{ message }}</p>
        }
        <button type="submit">Save settings</button>
      </form>

      <section class="conditions" aria-live="polite">
        @if (weatherState() === 'loading') {
          <p class="status">Loading current conditions…</p>
        } @else if (weatherState() === 'error') {
          <p class="status status--error">
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
    form {
      display: grid;
      grid-template-columns: 1fr 8rem auto;
      align-items: end;
      gap: 0.6rem;
    }
    label {
      display: grid;
      gap: 0.25rem;
      color: #526079;
      font-size: 0.8rem;
    }
    input,
    select,
    button {
      box-sizing: border-box;
      min-height: 2.25rem;
      border: 1px solid #9aa6ba;
      border-radius: 0.375rem;
      font: inherit;
    }
    input,
    select {
      width: 100%;
      padding: 0.35rem 0.5rem;
      color: #172033;
      background: #fff;
    }
    button {
      padding: 0.35rem 0.7rem;
      color: #fff;
      background: #075b67;
      border-color: #075b67;
      cursor: pointer;
      white-space: nowrap;
    }
    .validation {
      grid-column: 1 / -1;
      margin: 0;
      color: #b42318;
      font-size: 0.8rem;
    }
    .conditions {
      margin-top: 1.3rem;
    }
    .status,
    .details {
      color: #526079;
    }
    .status--error,
    .validation {
      color: #b42318;
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
    @media (max-width: 600px) {
      form {
        grid-template-columns: 1fr 1fr;
      }
      button {
        grid-column: 1 / -1;
      }
    }
  `,
})
export class WeatherWidgetComponent {
  readonly configuration = input<unknown>(DEFAULT_CONFIGURATION);

  protected readonly draftLocation = signal(DEFAULT_CONFIGURATION.location);
  protected readonly draftUnits = signal<WeatherUnits>(
    DEFAULT_CONFIGURATION.units,
  );
  protected readonly validationMessage = signal<string | null>(null);
  protected readonly weatherState = signal<'loading' | 'ready' | 'error'>(
    'loading',
  );
  protected readonly conditions = signal<WeatherConditions | null>(null);
  readonly #weatherData = inject(WEATHER_DATA_SOURCE);
  readonly #hostElement = inject(ElementRef<HTMLElement>);
  #requestRevision = 0;

  constructor() {
    effect(() => {
      const configuration = readConfiguration(this.configuration());
      this.#applyConfiguration(configuration);
    });
  }

  protected updateLocation(event: Event): void {
    const input = event.target;

    if (input instanceof HTMLInputElement) {
      this.draftLocation.set(input.value);
    }
  }

  protected updateUnits(event: Event): void {
    const select = event.target;

    if (select instanceof HTMLSelectElement && isUnits(select.value)) {
      this.draftUnits.set(select.value);
    }
  }

  protected saveSettings(event: SubmitEvent): void {
    event.preventDefault();
    const location = this.draftLocation().trim();
    const units = this.draftUnits();

    if (location.length === 0) {
      this.validationMessage.set('Enter a location.');
      return;
    }

    const configuration: WeatherConfiguration = { location, units };
    this.validationMessage.set(null);
    this.#applyConfiguration(configuration);
    this.#hostElement.nativeElement.dispatchEvent(
      new CustomEvent('configuration-changed', {
        bubbles: true,
        detail: configuration,
      }),
    );
  }

  #applyConfiguration(configuration: WeatherConfiguration): void {
    this.draftLocation.set(configuration.location);
    this.draftUnits.set(configuration.units);
    this.weatherState.set('loading');
    const request = ++this.#requestRevision;

    void this.#weatherData.read(configuration).then(
      (conditions) => {
        if (request === this.#requestRevision) {
          this.conditions.set(conditions);
          this.weatherState.set('ready');
        }
      },
      () => {
        if (request === this.#requestRevision) {
          this.conditions.set(null);
          this.weatherState.set('error');
        }
      },
    );
  }
}

function readConfiguration(value: unknown): WeatherConfiguration {
  if (!isRecord(value)) {
    return DEFAULT_CONFIGURATION;
  }

  if (
    typeof value['location'] === 'string' &&
    isUnits(value['units']) &&
    value['location'].trim().length > 0
  ) {
    return {
      location: value['location'].trim(),
      units: value['units'],
    };
  }

  return DEFAULT_CONFIGURATION;
}

function isUnits(value: unknown): value is WeatherUnits {
  return value === 'metric' || value === 'imperial';
}
