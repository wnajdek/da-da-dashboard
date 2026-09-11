import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardShellComponent } from './dashboard-shell.component';
import {
  DASHBOARD_STORAGE,
  DASHBOARD_STORAGE_KEY,
  DashboardPersistenceService,
} from './dashboard-persistence.service';
import { provideWidgetInstallationPersistence } from '../widget-installation/widget-installation-persistence.service';
import {
  WIDGET_ENTRY_BUNDLE_LOADER,
  type WidgetEntryBundleLoader,
} from '../widget-installation/widget-element-browser.adapters';
import {
  WIDGET_MANIFEST_SOURCE,
  type WidgetManifestSource,
} from '../widget-installation/widget-manifest-source';
import { TRUSTED_MANIFEST_ORIGINS } from '../widget-installation/widget-trust-policy';
import { BROWSER_VIEWPORT } from '../grid-layout/browser-viewport';
import type { Dashboard, WidgetConfiguration } from './dashboard.models';
import { MemoryStorage } from '../../testing/memory-storage';

const TRUSTED_ORIGIN = 'https://widgets.example.test';
const MANIFEST_URL = `${TRUSTED_ORIGIN}/continuity/manifest.json`;
const WIDGET_ELEMENT_TAG = 'dashboard-lifecycle-journey-widget';
const WIDGET_SETTINGS_ELEMENT_TAG =
  'dashboard-lifecycle-journey-widget-settings';
const SETTINGS_WIDGET_ELEMENT_TAG = 'dashboard-settings-journey-widget';
const SETTINGS_WIDGET_SETTINGS_ELEMENT_TAG =
  'dashboard-settings-journey-widget-settings';
const WIDGET_MANIFEST = {
  manifestVersion: 2 as const,
  type: 'continuity-widget',
  displayName: 'Continuity Widget',
  version: '1.0.0',
  elementTag: WIDGET_ELEMENT_TAG,
  settingsElementTag: WIDGET_SETTINGS_ELEMENT_TAG,
  entryBundleUrl: './continuity.js',
  defaultConfiguration: { location: 'Warsaw', units: 'metric' },
  preferredLayout: { w: 4, h: 3 },
};

const SETTINGS_WIDGET_MANIFEST = {
  ...WIDGET_MANIFEST,
  type: 'settings-continuity-widget',
  elementTag: SETTINGS_WIDGET_ELEMENT_TAG,
  settingsElementTag: SETTINGS_WIDGET_SETTINGS_ELEMENT_TAG,
  entryBundleUrl: './settings-continuity.js',
};

describe('DashboardShellComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('orchestrates Dashboard recovery feedback', async () => {
    const storage = new MemoryStorage();
    storage.setItem(DASHBOARD_STORAGE_KEY, 'invalid');
    const fixture = await createShellFixture(storage, {
      load: jasmine.createSpy('load'),
    });
    spyOn(TestBed.inject(DashboardPersistenceService), 'save').and.returnValue(
      false,
    );

    getHost(fixture).querySelector<HTMLButtonElement>('button')?.click();
    await render(fixture);

    expect(
      getHost(fixture).querySelector(
        '[data-testid="dashboard-persistence-status"]',
      )?.textContent,
    ).toContain('The requested Dashboard change could not be saved locally.');
  });

  it('opens one Widget Settings Drawer and persists settings without dismissing it', async () => {
    const storage = new MemoryStorage();
    const fixture = await createShellFixture(
      storage,
      {
        load: jasmine.createSpy('load').and.resolveTo(SETTINGS_WIDGET_MANIFEST),
      },
      {
        load: jasmine.createSpy('load').and.callFake(async () => {
          if (customElements.get(SETTINGS_WIDGET_ELEMENT_TAG) === undefined) {
            customElements.define(
              SETTINGS_WIDGET_ELEMENT_TAG,
              JourneyWidgetElement,
            );
          }
          if (
            customElements.get(SETTINGS_WIDGET_SETTINGS_ELEMENT_TAG) ===
            undefined
          ) {
            customElements.define(
              SETTINGS_WIDGET_SETTINGS_ELEMENT_TAG,
              JourneyWidgetSettingsElement,
            );
          }
        }),
      },
    );

    await installWidget(fixture, MANIFEST_URL);
    await render(fixture);
    getHost(fixture)
      .querySelector<HTMLButtonElement>('[data-testid="add-widget"]')
      ?.click();
    await render(fixture);
    openWidgetActionMenu(getHost(fixture));
    document
      .querySelector<HTMLButtonElement>('[data-testid="edit-widget-instance"]')
      ?.click();
    await render(fixture);
    await render(fixture);

    const drawer = getHost(fixture).querySelector<HTMLElement>(
      '[data-testid="widget-settings-drawer"]',
    );
    const settingsElement = drawer?.querySelector<JourneyWidgetSettingsElement>(
      SETTINGS_WIDGET_SETTINGS_ELEMENT_TAG,
    );

    expect(drawer?.textContent).toContain('Configure Continuity Widget');
    expect(settingsElement).not.toBeNull();

    settingsElement?.dispatchEvent(
      new CustomEvent('configuration-changed', {
        bubbles: true,
        detail: { location: 'Gdańsk', units: 'imperial' },
      }),
    );
    await render(fixture);

    expect(
      JSON.stringify(savedDashboard(storage).widgets[0].configuration),
    ).toBe('{"location":"Gdańsk","units":"imperial"}');
    expect(
      getHost(fixture).querySelector('[data-testid="widget-settings-drawer"]'),
    ).not.toBeNull();
  });
});

class JourneyWidgetElement extends HTMLElement {
  configuration: WidgetConfiguration = {};
}

class JourneyWidgetSettingsElement extends HTMLElement {
  configuration: WidgetConfiguration = {};
}

async function createShellFixture(
  storage: MemoryStorage,
  source: WidgetManifestSource,
  loader?: WidgetEntryBundleLoader,
): Promise<ComponentFixture<DashboardShellComponent>> {
  await TestBed.configureTestingModule({
    imports: [DashboardShellComponent],
    providers: [
      provideZonelessChangeDetection(),
      { provide: BROWSER_VIEWPORT, useValue: { width: signal(1_280) } },
      { provide: DASHBOARD_STORAGE, useValue: storage },
      { provide: TRUSTED_MANIFEST_ORIGINS, useValue: [TRUSTED_ORIGIN] },
      { provide: WIDGET_MANIFEST_SOURCE, useValue: source },
      ...(loader === undefined
        ? []
        : [{ provide: WIDGET_ENTRY_BUNDLE_LOADER, useValue: loader }]),
      provideWidgetInstallationPersistence(),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(DashboardShellComponent);
  fixture.detectChanges();
  return fixture;
}

async function installWidget(
  fixture: ComponentFixture<DashboardShellComponent>,
  manifestUrl: string,
): Promise<void> {
  const host = getHost(fixture);
  host
    .querySelector<HTMLButtonElement>('[data-testid="open-widget-drawer"]')
    ?.click();
  await render(fixture);
  const input = host.querySelector<HTMLInputElement>(
    '[data-testid="manifest-url"]',
  );
  const form = host.querySelector<HTMLFormElement>(
    '[data-testid="install-widget-form"]',
  );

  if (input === null || form === null) {
    throw new Error('The Widget Catalog installation controls are missing.');
  }

  input.value = manifestUrl;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  form.dispatchEvent(
    new SubmitEvent('submit', { bubbles: true, cancelable: true }),
  );
}

function getHost(
  fixture: ComponentFixture<DashboardShellComponent>,
): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

function openWidgetActionMenu(host: HTMLElement): void {
  host
    .querySelector<HTMLButtonElement>('[data-testid="widget-action-menu"]')
    ?.click();
}

async function render(
  fixture: ComponentFixture<DashboardShellComponent>,
): Promise<void> {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await fixture.whenStable();
    await waitForBrowserRender();
    fixture.detectChanges();
  }
}

function waitForBrowserRender(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}

function savedDashboard(storage: MemoryStorage): Dashboard {
  return JSON.parse(storage.getItem(DASHBOARD_STORAGE_KEY)!)
    .dashboard as Dashboard;
}
