import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { createApplication } from '@angular/platform-browser';
import { createWeatherWidgetElement } from '../../../projects/weather-widget/src/weather-widget-element';
import { WeatherWidgetComponent } from '../../../projects/weather-widget/src/weather-widget.component';
import {
  WEATHER_DATA_SOURCE,
  WeatherDataSource,
} from '../../../projects/weather-widget/src/weather-data.service';
import type {
  WeatherConditions,
  WeatherConfiguration,
} from '../../../projects/weather-widget/src/weather-widget.models';

describe('WeatherWidgetComponent', () => {
  let fixture: ComponentFixture<WeatherWidgetComponent>;
  let source: jasmine.SpyObj<WeatherDataSource>;

  beforeEach(async () => {
    source = jasmine.createSpyObj<WeatherDataSource>('WeatherDataSource', [
      'read',
    ]);
    source.read.and.resolveTo({
      location: 'Warsaw',
      temperature: 21.5,
      temperatureUnit: '°C',
      humidity: 55,
      weatherCode: 1,
    });

    await TestBed.configureTestingModule({
      imports: [WeatherWidgetComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: WEATHER_DATA_SOURCE, useValue: source },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherWidgetComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('fetches and displays conditions for its own default settings', () => {
    expect(source.read).toHaveBeenCalledWith({
      location: 'Warsaw',
      units: 'metric',
    });
    expect(fixture.nativeElement.textContent).toContain('21.5°C');
    expect(fixture.nativeElement.textContent).toContain('Humidity 55%');
  });

  it('shows a settings-validation state without requesting weather for invalid configuration', async () => {
    const invalidFixture = TestBed.createComponent(WeatherWidgetComponent);
    invalidFixture.componentRef.setInput('configuration', {
      location: '  ',
      units: 'metric',
    });
    invalidFixture.detectChanges();
    await invalidFixture.whenStable();
    invalidFixture.detectChanges();

    expect(source.read).toHaveBeenCalledTimes(1);
    expect(invalidFixture.nativeElement.textContent).toContain(
      'Enter a location.',
    );

    invalidFixture.destroy();
  });

  it('validates its settings and emits a complete replacement configuration', async () => {
    const host = fixture.nativeElement as HTMLElement;
    const location = host.querySelector<HTMLInputElement>('input');
    const form = host.querySelector<HTMLFormElement>('form');

    if (location === null || form === null) {
      throw new Error('Weather settings form is missing.');
    }

    location.value = '  ';
    location.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(
      new SubmitEvent('submit', { bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(host.textContent).toContain('Enter a location.');
    expect(source.read).toHaveBeenCalledTimes(1);

    const changes: Event[] = [];
    host.addEventListener('configuration-changed', (event) =>
      changes.push(event),
    );
    location.value = 'Krakow';
    location.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(
      new SubmitEvent('submit', { bubbles: true, cancelable: true }),
    );
    await fixture.whenStable();

    expect(changes).toHaveSize(1);
    expect((changes[0] as CustomEvent).detail).toEqual({
      location: 'Krakow',
      units: 'metric',
    });
    expect(source.read).toHaveBeenCalledTimes(2);
  });

  it('shows a loading state while a newly saved location is being fetched', async () => {
    let resolve: ((conditions: WeatherConditions) => void) | undefined;
    source.read.and.returnValue(
      new Promise<WeatherConditions>((complete) => {
        resolve = complete;
      }),
    );
    const host = fixture.nativeElement as HTMLElement;
    const form = host.querySelector<HTMLFormElement>('form');

    if (form === null) {
      throw new Error('Weather settings form is missing.');
    }

    form.dispatchEvent(
      new SubmitEvent('submit', { bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(host.textContent).toContain('Loading current conditions');
    resolve?.({
      location: 'Warsaw',
      temperature: 20,
      temperatureUnit: '°C',
      humidity: 50,
      weatherCode: 2,
    });
    await fixture.whenStable();
  });

  it('shows a contained error state when its data provider fails', async () => {
    source.read.and.rejectWith(new Error('network unavailable'));
    const host = fixture.nativeElement as HTMLElement;
    const form = host.querySelector<HTMLFormElement>('form');

    if (form === null) {
      throw new Error('Weather settings form is missing.');
    }

    form.dispatchEvent(
      new SubmitEvent('submit', { bubbles: true, cancelable: true }),
    );
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.textContent).toContain('Weather data could not be loaded.');
  });

  it('renders the result for changed settings without recreating the widget', async () => {
    const host = fixture.nativeElement as HTMLElement;
    const form = host.querySelector<HTMLFormElement>('form');
    const location = host.querySelector<HTMLInputElement>('input');
    const units = host.querySelector<HTMLSelectElement>('select');
    const component = fixture.componentInstance;
    const requests: Array<{
      configuration: WeatherConfiguration;
      resolve: (conditions: WeatherConditions) => void;
    }> = [];

    if (form === null || location === null || units === null) {
      throw new Error('Weather settings form is missing.');
    }

    source.read.calls.reset();
    source.read.and.callFake(
      (configuration: WeatherConfiguration) =>
        new Promise<WeatherConditions>((resolve) => {
          requests.push({ configuration, resolve });
        }),
    );

    location.value = 'Krakow';
    location.dispatchEvent(new Event('input', { bubbles: true }));
    units.value = 'imperial';
    units.dispatchEvent(new Event('change', { bubbles: true }));
    form.dispatchEvent(
      new SubmitEvent('submit', { bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(requests).toHaveSize(1);
    expect(requests[0].configuration).toEqual({
      location: 'Krakow',
      units: 'imperial',
    });
    expect(host.textContent).toContain('Loading current conditions');

    requests[0].resolve({
      location: 'Krakow',
      temperature: 68,
      temperatureUnit: '°F',
      humidity: 42,
      weatherCode: 2,
    });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance).toBe(component);
    expect(host.textContent).toContain('Krakow');
    expect(host.textContent).toContain('68°F');
    expect(host.textContent).toContain('Humidity 42%');

    fixture.componentRef.setInput('configuration', {
      location: 'Krakow',
      units: 'imperial',
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(requests).toHaveSize(1);
  });

  it('implements the Widget Element configuration property and change-event contract', async () => {
    const application = await createApplication({
      providers: [
        provideZonelessChangeDetection(),
        { provide: WEATHER_DATA_SOURCE, useValue: source },
      ],
    });
    const tag = 'weather-widget-contract-test';

    if (customElements.get(tag) === undefined) {
      customElements.define(
        tag,
        createWeatherWidgetElement(Promise.resolve(application)),
      );
    }

    const element = document.createElement(tag) as HTMLElement & {
      configuration: unknown;
    };
    const changes: CustomEvent<unknown>[] = [];
    element.addEventListener('configuration-changed', (event) =>
      changes.push(event as CustomEvent<unknown>),
    );
    element.configuration = { location: 'Gdańsk', units: 'imperial' };
    document.body.append(element);
    await waitForWidgetElement();

    const location = element.querySelector<HTMLInputElement>('input');
    const form = element.querySelector<HTMLFormElement>('form');

    if (location === null || form === null) {
      throw new Error('Weather Widget Element settings form is missing.');
    }

    expect(location.value).toBe('Gdańsk');
    location.value = 'Kraków';
    location.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(
      new SubmitEvent('submit', { bubbles: true, cancelable: true }),
    );
    await waitForWidgetElement();

    expect(changes).toHaveSize(1);
    expect(changes[0].detail).toEqual({
      location: 'Kraków',
      units: 'imperial',
    });

    element.configuration = { location: 'Lublin', units: 'metric' };
    await waitForWidgetElement();

    expect(location.value).toBe('Lublin');
    expect(source.read).toHaveBeenCalledWith({
      location: 'Lublin',
      units: 'metric',
    });
    element.remove();
    application.destroy();
  });
});

function waitForWidgetElement(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}
