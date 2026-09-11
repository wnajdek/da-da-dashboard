import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WeatherDataSource, WEATHER_DATA_SOURCE } from './weather-data.service';
import { WeatherWidgetComponent } from './weather-widget.component';

describe('WeatherWidgetComponent', () => {
  let fixture: ComponentFixture<WeatherWidgetComponent>;
  let source: jasmine.SpyObj<WeatherDataSource>;

  beforeEach(async () => {
    source = jasmine.createSpyObj<WeatherDataSource>('WeatherDataSource', [
      'read',
    ]);
    source.read.and.resolveTo({
      location: 'Cracow',
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

  it('renders weather for its configuration without exposing settings controls', () => {
    expect(source.read).toHaveBeenCalledWith({
      location: 'Cracow',
      units: 'metric',
    });
    expect(fixture.nativeElement.textContent).toContain('21.5°C');
    expect(fixture.nativeElement.textContent).toContain('Humidity 55%');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('shows a contained invalid-configuration state without requesting weather', async () => {
    source.read.calls.reset();
    fixture.componentRef.setInput('configuration', {
      location: '  ',
      units: 'metric',
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(source.read).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Enter a location.');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('updates its displayed conditions when the Dashboard replaces configuration', async () => {
    source.read.calls.reset();
    source.read.and.resolveTo({
      location: 'Gdańsk',
      temperature: 68,
      temperatureUnit: '°F',
      humidity: 42,
      weatherCode: 2,
    });

    fixture.componentRef.setInput('configuration', {
      location: 'Gdańsk',
      units: 'imperial',
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(source.read).toHaveBeenCalledWith({
      location: 'Gdańsk',
      units: 'imperial',
    });
    expect(fixture.nativeElement.textContent).toContain('Gdańsk');
    expect(fixture.nativeElement.textContent).toContain('68°F');
  });
});
