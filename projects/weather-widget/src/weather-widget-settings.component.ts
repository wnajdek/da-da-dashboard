import {
  Component,
  ElementRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  areWeatherConfigurationsEqual,
  DEFAULT_WEATHER_CONFIGURATION,
  isWeatherUnits,
  readWeatherConfiguration,
} from './weather-configuration';
import type {
  WeatherConfiguration,
  WeatherUnits,
} from './weather-widget.models';

@Component({
  selector: 'weather-widget-settings',
  template: `
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
      @if (saveMessage(); as message) {
        <p class="saved" role="status">{{ message }}</p>
      }
      <button type="submit">Save settings</button>
    </form>
  `,
  styles: `
    :host {
      display: block;
      font:
        16px/1.4 Inter,
        system-ui,
        sans-serif;
    }
    form {
      display: grid;
      gap: 1rem;
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
    }
    .validation {
      margin: 0;
      color: #b42318;
      font-size: 0.8rem;
    }
    .saved {
      margin: 0;
      color: #067647;
      font-size: 0.8rem;
    }
  `,
})
export class WeatherWidgetSettingsComponent {
  readonly configuration = input<unknown>(DEFAULT_WEATHER_CONFIGURATION);

  protected readonly draftLocation = signal(
    DEFAULT_WEATHER_CONFIGURATION.location,
  );
  protected readonly draftUnits = signal<WeatherUnits>(
    DEFAULT_WEATHER_CONFIGURATION.units,
  );
  protected readonly validationMessage = signal<string | null>(null);
  protected readonly saveMessage = signal<string | null>(null);
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private pendingConfiguration: WeatherConfiguration | null = null;

  constructor() {
    effect(() => {
      const result = readWeatherConfiguration(this.configuration());
      const configuration =
        result.status === 'valid'
          ? result.configuration
          : { location: result.location, units: result.units };

      this.draftLocation.set(configuration.location);
      this.draftUnits.set(configuration.units);
      this.validationMessage.set(
        result.status === 'invalid' ? result.message : null,
      );

      if (
        result.status === 'valid' &&
        this.pendingConfiguration !== null &&
        areWeatherConfigurationsEqual(
          result.configuration,
          this.pendingConfiguration,
        )
      ) {
        this.saveMessage.set('Settings saved.');
        this.pendingConfiguration = null;
      } else {
        this.saveMessage.set(null);
      }
    });
  }

  protected updateLocation(event: Event): void {
    const input = event.target;

    if (input instanceof HTMLInputElement) {
      this.draftLocation.set(input.value);
      this.clearFeedback();
    }
  }

  protected updateUnits(event: Event): void {
    const select = event.target;

    if (select instanceof HTMLSelectElement && isWeatherUnits(select.value)) {
      this.draftUnits.set(select.value);
      this.clearFeedback();
    }
  }

  protected saveSettings(event: SubmitEvent): void {
    event.preventDefault();
    const result = readWeatherConfiguration({
      location: this.draftLocation(),
      units: this.draftUnits(),
    });

    if (result.status === 'invalid') {
      this.validationMessage.set(result.message);
      this.saveMessage.set(null);
      return;
    }

    this.pendingConfiguration = result.configuration;
    this.validationMessage.set(null);
    this.saveMessage.set(null);
    this.hostElement.nativeElement.dispatchEvent(
      new CustomEvent('configuration-changed', {
        bubbles: true,
        detail: result.configuration,
      }),
    );
  }

  private clearFeedback(): void {
    this.pendingConfiguration = null;
    this.validationMessage.set(null);
    this.saveMessage.set(null);
  }
}
