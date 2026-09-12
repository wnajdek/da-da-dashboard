import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
  manifestVersion: 2,
  type: 'weather',
  displayName: 'Weather',
  description: 'Current conditions',
  version: '1.0.0',
  elementTag: 'weather-widget',
  settingsElementTag: 'weather-widget-settings',
  entryBundleUrl: `${TRUSTED_ORIGIN}/weather/entry.js`,
  defaultConfiguration: { location: 'Warsaw', units: 'metric' },
  preferredLayout: { w: 4, h: 3 },
};

describe('WidgetCatalogComponent', () => {
  it('links to Installed Widgets instead of installing in the drawer', async () => {
    const fixture = await createCatalogFixture({
      load: jasmine.createSpy('load'),
    });
    const host = fixture.nativeElement as HTMLElement;
    const link = host.querySelector<HTMLAnchorElement>(
      '[data-testid="manage-installed-widgets"]',
    );

    expect(link?.textContent).toContain('Manage installed widgets');
    expect(link?.getAttribute('href')).toBe('/widgets?returnTo=add-widget');
    expect(
      host.querySelector('[data-testid="install-widget-form"]'),
    ).toBeNull();
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

  it('filters installed Widget Types by display name and description', async () => {
    const fixture = await createCatalogFixture(
      { load: jasmine.createSpy('load') },
      [WEATHER_INSTALLATION],
    );
    const host = fixture.nativeElement as HTMLElement;
    const search = host.querySelector<HTMLInputElement>(
      '[data-testid="widget-search"]',
    );

    if (search === null) {
      throw new Error('The Widget Type search field is missing.');
    }

    search.value = 'conditions';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(
      host.querySelectorAll('[data-testid="available-widget"]'),
    ).toHaveSize(1);

    search.value = 'does not match';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(
      host.querySelectorAll('[data-testid="available-widget"]'),
    ).toHaveSize(0);
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
      provideRouter([]),
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
  fixture.componentRef.setInput('isOpen', true);
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
