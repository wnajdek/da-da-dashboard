import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WeatherWidgetComponent } from '../../../projects/weather-widget/src/weather-widget.component';
import {
  WEATHER_DATA_SOURCE,
  WeatherDataSource,
} from '../../../projects/weather-widget/src/weather-data.service';
import type { WeatherConditions } from '../../../projects/weather-widget/src/weather-widget.models';

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
});
