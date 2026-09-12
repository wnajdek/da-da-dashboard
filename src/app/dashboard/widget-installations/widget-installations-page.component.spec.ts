import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DASHBOARD_STORAGE } from '../workspace/dashboard-persistence.service';
import { MemoryStorage } from '../../testing/memory-storage';
import {
  WidgetInstallationPersistenceService,
  provideWidgetInstallationPersistence,
} from '../widget-installation/widget-installation-persistence.service';
import type { WidgetInstallation } from '../widget-installation/widget-installation.models';
import { WidgetInstallationsPageComponent } from './widget-installations-page.component';
import {
  WIDGET_MANIFEST_SOURCE,
  type WidgetManifestSource,
} from '../widget-installation/widget-manifest-source';
import { TRUSTED_MANIFEST_ORIGINS } from '../widget-installation/widget-trust-policy';
import { BROWSER_VIEWPORT } from '../grid-layout/browser-viewport';

const WEATHER_INSTALLATION: WidgetInstallation = {
  manifestUrl: 'https://widgets.example.test/weather/manifest.json',
  manifestVersion: 2,
  type: 'weather',
  displayName: 'Weather',
  description: 'Current conditions for a saved location',
  version: '1.0.0',
  elementTag: 'weather-widget',
  settingsElementTag: 'weather-widget-settings',
  entryBundleUrl: 'https://widgets.example.test/weather/entry.js',
  defaultConfiguration: { location: 'Warsaw', units: 'metric' },
  preferredLayout: { w: 4, h: 3 },
};

describe('WidgetInstallationsPageComponent', () => {
  it('lists installed Widgets with their manifest metadata', async () => {
    const fixture = await createPageFixture([WEATHER_INSTALLATION]);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('h1')?.textContent).toContain(
      'Installed widgets',
    );
    expect(host.textContent).toContain('Weather');
    expect(host.textContent).toContain(
      'Current conditions for a saved location',
    );
    expect(host.textContent).toContain('weather');
    expect(host.textContent).toContain('1.0.0');
    expect(host.textContent).toContain('weather-widget');
    expect(host.textContent).toContain('weather-widget-settings');
    expect(
      host.querySelector('[data-testid="manifest-source"]')?.textContent,
    ).toContain('widgets.example.test');
  });

  it('installs a Widget Manifest without leaving the management page', async () => {
    const source: WidgetManifestSource = {
      load: jasmine.createSpy('load').and.resolveTo({
        ...WEATHER_INSTALLATION,
        entryBundleUrl: './entry.js',
      }),
    };
    const fixture = await createPageFixture([], source);
    const host = fixture.nativeElement as HTMLElement;

    host
      .querySelector<HTMLButtonElement>(
        '[data-testid="open-install-widget-form"]',
      )
      ?.click();
    fixture.detectChanges();
    const input = host.querySelector<HTMLInputElement>(
      '[data-testid="manifest-url"]',
    );
    const form = host.querySelector<HTMLFormElement>(
      '[data-testid="install-widget-form"]',
    );

    if (input === null || form === null) {
      throw new Error('The installation controls are missing.');
    }

    input.value = WEATHER_INSTALLATION.manifestUrl;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(
      new SubmitEvent('submit', { bubbles: true, cancelable: true }),
    );
    await fixture.whenStable();
    fixture.detectChanges();

    expect(source.load).toHaveBeenCalledOnceWith(
      WEATHER_INSTALLATION.manifestUrl,
    );
    expect(host.textContent).toContain('Installed “Weather”.');
    expect(
      host.querySelector('[data-testid="install-widget-form"]'),
    ).toBeNull();
    expect(
      host.querySelectorAll('[data-testid="installed-widget"]'),
    ).toHaveSize(1);
  });
});

async function createPageFixture(
  installations: readonly WidgetInstallation[],
  source: WidgetManifestSource = { load: jasmine.createSpy('load') },
): Promise<ComponentFixture<WidgetInstallationsPageComponent>> {
  const storage = new MemoryStorage();
  await TestBed.configureTestingModule({
    imports: [WidgetInstallationsPageComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: DASHBOARD_STORAGE, useValue: storage },
      { provide: BROWSER_VIEWPORT, useValue: { width: signal(1_280) } },
      { provide: WIDGET_MANIFEST_SOURCE, useValue: source },
      {
        provide: TRUSTED_MANIFEST_ORIGINS,
        useValue: ['https://widgets.example.test'],
      },
      provideWidgetInstallationPersistence(),
    ],
  }).compileComponents();
  TestBed.inject(WidgetInstallationPersistenceService).save(installations);
  const fixture = TestBed.createComponent(WidgetInstallationsPageComponent);
  fixture.detectChanges();
  return fixture;
}
