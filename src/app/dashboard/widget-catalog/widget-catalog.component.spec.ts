import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardStore } from '../workspace/dashboard.store';
import { DASHBOARD_STORAGE } from '../workspace/dashboard-persistence.service';
import { MemoryStorage } from '../../testing/memory-storage';
import {
  WidgetInstallationPersistenceService,
  provideWidgetInstallationPersistence,
} from '../widget-installation/widget-installation-persistence.service';
import {
  WIDGET_MANIFEST_SOURCE,
  type WidgetManifestSource,
} from '../widget-installation/widget-manifest-source';
import { TRUSTED_MANIFEST_ORIGINS } from '../widget-installation/widget-trust-policy';
import { WidgetCatalogComponent } from './widget-catalog.component';
import type { WidgetInstallation } from '../widget-installation/widget-installation.models';

const TRUSTED_ORIGIN = 'https://widgets.example.test';
const MANIFEST_URL = `${TRUSTED_ORIGIN}/weather/manifest.json`;
const WEATHER_INSTALLATION: WidgetInstallation = {
  manifestUrl: MANIFEST_URL,
  manifestVersion: 1,
  type: 'weather',
  displayName: 'Weather',
  description: 'Current conditions',
  version: '1.0.0',
  elementTag: 'weather-widget',
  entryBundleUrl: `${TRUSTED_ORIGIN}/weather/entry.js`,
  defaultConfiguration: { location: 'Warsaw', units: 'metric' },
  preferredLayout: { w: 4, h: 3 },
};

describe('WidgetCatalogComponent', () => {
  it('announces installation persistence recovery separately from operation feedback', async () => {
    const storage = new MemoryStorage();
    storage.setItem('configurable-dashboard.widget-installations', '{');
    const fixture = await createCatalogFixture(
      { load: jasmine.createSpy('load') },
      [],
      storage,
    );

    const recovery = (
      fixture.nativeElement as HTMLElement
    ).querySelector<HTMLElement>(
      '[data-testid="widget-installation-recovery"]',
    );
    expect(recovery?.getAttribute('role')).toBe('alert');
    expect(recovery?.textContent).toContain(
      'Saved Widget Installations could not be read.',
    );
  });

  it('installs a trusted manifest and exposes its metadata', async () => {
    const source: WidgetManifestSource = {
      load: jasmine.createSpy('load').and.resolveTo({
        ...WEATHER_INSTALLATION,
        entryBundleUrl: './entry.js',
      }),
    };
    const fixture = await createCatalogFixture(source);

    submitManifest(fixture, MANIFEST_URL);
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(source.load).toHaveBeenCalledOnceWith(MANIFEST_URL);
    expect(host.textContent).toContain('Weather');
    expect(host.textContent).toContain('Current conditions');
    expect(host.textContent).toContain('4 × 3');
    expect(
      host.querySelector('[data-testid="widget-installation-status"]')
        ?.textContent,
    ).toContain('Installed');
  });

  it('adds a Widget Instance with the manifest defaults and preferred size', async () => {
    const fixture = await createCatalogFixture(
      { load: jasmine.createSpy('load') },
      [WEATHER_INSTALLATION],
    );

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-testid="add-widget"]')
      ?.click();
    fixture.detectChanges();

    const widget = TestBed.inject(DashboardStore).dashboard()?.widgets[0];
    expect(widget?.type).toBe('weather');
    expect(JSON.stringify(widget?.configuration)).toBe(
      '{"location":"Warsaw","units":"metric"}',
    );
    expect(widget?.layout).toEqual(jasmine.objectContaining({ w: 4, h: 3 }));
  });

  it('removes an installation while keeping existing Widget Instances', async () => {
    const fixture = await createCatalogFixture(
      { load: jasmine.createSpy('load') },
      [WEATHER_INSTALLATION],
    );
    const store = TestBed.inject(DashboardStore);
    store.addWidget({
      type: WEATHER_INSTALLATION.type,
      configuration: WEATHER_INSTALLATION.defaultConfiguration,
      preferredLayout: WEATHER_INSTALLATION.preferredLayout,
    });

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>(
        '[data-testid="remove-widget-installation"]',
      )
      ?.click();
    fixture.detectChanges();

    expect(store.dashboard()?.widgets).toHaveSize(1);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Existing Widget Instances are now unavailable.',
    );
  });
});

async function createCatalogFixture(
  source: WidgetManifestSource,
  installations: readonly WidgetInstallation[] = [],
  storage = new MemoryStorage(),
): Promise<ComponentFixture<WidgetCatalogComponent>> {
  await TestBed.configureTestingModule({
    imports: [WidgetCatalogComponent],
    providers: [
      provideZonelessChangeDetection(),
      { provide: DASHBOARD_STORAGE, useValue: storage },
      provideWidgetInstallationPersistence(),
      WidgetInstallationPersistenceService,
      { provide: WIDGET_MANIFEST_SOURCE, useValue: source },
      { provide: TRUSTED_MANIFEST_ORIGINS, useValue: [TRUSTED_ORIGIN] },
    ],
  }).compileComponents();
  if (installations.length > 0) {
    TestBed.inject(WidgetInstallationPersistenceService).save(installations);
  }
  const fixture = TestBed.createComponent(WidgetCatalogComponent);
  fixture.detectChanges();
  return fixture;
}

function submitManifest(
  fixture: ComponentFixture<WidgetCatalogComponent>,
  manifestUrl: string,
): void {
  const host = fixture.nativeElement as HTMLElement;
  const input = host.querySelector<HTMLInputElement>(
    '[data-testid="manifest-url"]',
  );
  const form = host.querySelector<HTMLFormElement>(
    '[data-testid="install-widget-form"]',
  );

  if (input === null || form === null) {
    throw new Error('The Widget Manifest installation form is missing.');
  }

  input.value = manifestUrl;
  input.dispatchEvent(new Event('input'));
  form.dispatchEvent(new SubmitEvent('submit', { cancelable: true }));
}
