import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WeatherWidgetSettingsComponent } from './weather-widget-settings.component';

describe('WeatherWidgetSettingsComponent', () => {
  let fixture: ComponentFixture<WeatherWidgetSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherWidgetSettingsComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherWidgetSettingsComponent);
    fixture.componentRef.setInput('configuration', {
      location: 'Gdańsk',
      units: 'imperial',
    });
    fixture.detectChanges();
  });

  it('emits a complete replacement configuration when the user saves valid settings', () => {
    const host = fixture.nativeElement as HTMLElement;
    const location = host.querySelector<HTMLInputElement>('input');
    const form = host.querySelector<HTMLFormElement>('form');
    const changes: CustomEvent<unknown>[] = [];

    if (location === null || form === null) {
      throw new Error('Weather settings form is missing.');
    }

    host.addEventListener('configuration-changed', (event) =>
      changes.push(event as CustomEvent<unknown>),
    );
    location.value = 'Kraków';
    location.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(
      new SubmitEvent('submit', { bubbles: true, cancelable: true }),
    );

    expect(changes).toHaveSize(1);
    expect(changes[0].detail).toEqual({
      location: 'Kraków',
      units: 'imperial',
    });
  });

  it('validates incomplete settings without emitting a configuration change', () => {
    const host = fixture.nativeElement as HTMLElement;
    const location = host.querySelector<HTMLInputElement>('input');
    const form = host.querySelector<HTMLFormElement>('form');
    const changes: Event[] = [];

    if (location === null || form === null) {
      throw new Error('Weather settings form is missing.');
    }

    host.addEventListener('configuration-changed', (event) =>
      changes.push(event),
    );
    location.value = '  ';
    location.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(
      new SubmitEvent('submit', { bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(changes).toHaveSize(0);
    expect(host.textContent).toContain('Enter a location.');
  });

  it('shows saved feedback only after the Dashboard returns the saved configuration', () => {
    const host = fixture.nativeElement as HTMLElement;
    const location = host.querySelector<HTMLInputElement>('input');
    const form = host.querySelector<HTMLFormElement>('form');

    if (location === null || form === null) {
      throw new Error('Weather settings form is missing.');
    }

    location.value = 'Kraków';
    location.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(
      new SubmitEvent('submit', { bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(host.textContent).not.toContain('Settings saved.');

    fixture.componentRef.setInput('configuration', {
      location: 'Kraków',
      units: 'imperial',
    });
    fixture.detectChanges();

    expect(host.textContent).toContain('Settings saved.');

    location.value = 'Lublin';
    location.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(host.textContent).not.toContain('Settings saved.');
  });
});
