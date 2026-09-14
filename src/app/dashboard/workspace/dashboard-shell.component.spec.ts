import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardShellComponent } from './dashboard-shell.component';
import { DashboardStore } from './dashboard.store';
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
import { WidgetInstallationService } from '../widget-installation/widget-installation.service';

const TRUSTED_ORIGIN = 'https://widgets.example.test';
const MANIFEST_URL = `${TRUSTED_ORIGIN}/continuity/manifest.json`;
const WIDGET_ELEMENT_TAG = 'dashboard-lifecycle-journey-widget';
const WIDGET_SETTINGS_ELEMENT_TAG =
  'dashboard-lifecycle-journey-widget-settings';
const SETTINGS_WIDGET_ELEMENT_TAG = 'dashboard-settings-journey-widget';
const SETTINGS_WIDGET_SETTINGS_ELEMENT_TAG =
  'dashboard-settings-journey-widget-settings';
const WEATHER_MANIFEST_URL = `${TRUSTED_ORIGIN}/weather/manifest.json`;
const FOCUS_TIMER_MANIFEST_URL = `${TRUSTED_ORIGIN}/focus-timer/manifest.json`;
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

const WEATHER_WIDGET_MANIFEST = {
  ...WIDGET_MANIFEST,
  type: 'weather',
  displayName: 'Weather',
  elementTag: 'dashboard-weather-widget',
  settingsElementTag: 'dashboard-weather-widget-settings',
  entryBundleUrl: './weather.js',
};

const FOCUS_TIMER_WIDGET_MANIFEST = {
  manifestVersion: 2 as const,
  type: 'focus-timer',
  displayName: 'Focus timer',
  description: 'A local countdown for a single focused task',
  version: '1.0.0',
  elementTag: 'sample-focus-timer-widget',
  settingsElementTag: 'sample-focus-timer-widget-settings',
  entryBundleUrl: './main.js',
  defaultConfiguration: { task: 'Focus session', durationMinutes: 25 },
  preferredLayout: { w: 3, h: 2 },
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

  it('keeps multiple Focus Timer Widget Instances independent from Weather across reload and removal', async () => {
    const storage = new MemoryStorage();
    const fixture = await createWeatherAndFocusTimerFixture(storage);

    await installWidget(fixture, WEATHER_MANIFEST_URL);
    await installWidget(fixture, FOCUS_TIMER_MANIFEST_URL);
    const store = TestBed.inject(DashboardStore);
    store.addWidget({
      type: FOCUS_TIMER_WIDGET_MANIFEST.type,
      configuration: FOCUS_TIMER_WIDGET_MANIFEST.defaultConfiguration,
      preferredLayout: FOCUS_TIMER_WIDGET_MANIFEST.preferredLayout,
    });

    const focusTimers = store
      .dashboard()!
      .widgets.filter((widget) => widget.type === 'focus-timer');
    const [firstFocusTimer, secondFocusTimer] = focusTimers;

    if (firstFocusTimer === undefined || secondFocusTimer === undefined) {
      throw new Error('Focus Timer Widget Instances are missing.');
    }

    store.updateWidgetConfiguration({
      id: firstFocusTimer.id,
      configuration: { task: 'Write the release notes', durationMinutes: 45 },
    });
    store.updateWidgetConfiguration({
      id: secondFocusTimer.id,
      configuration: { task: 'Plan tomorrow', durationMinutes: 15 },
    });

    expect(savedDashboard(storage).widgets).toEqual([
      jasmine.objectContaining({
        type: 'weather',
        configuration: { location: 'Warsaw', units: 'metric' },
      }),
      jasmine.objectContaining({
        id: firstFocusTimer.id,
        type: 'focus-timer',
        configuration: { task: 'Write the release notes', durationMinutes: 45 },
      }),
      jasmine.objectContaining({
        id: secondFocusTimer.id,
        type: 'focus-timer',
        configuration: { task: 'Plan tomorrow', durationMinutes: 15 },
      }),
    ]);

    TestBed.resetTestingModule();
    await createWeatherAndFocusTimerFixture(storage);
    const reloadedStore = TestBed.inject(DashboardStore);
    const reloadedFocusTimers = reloadedStore
      .dashboard()!
      .widgets.filter((widget) => widget.type === 'focus-timer');
    const [reloadedFirstFocusTimer, reloadedSecondFocusTimer] =
      reloadedFocusTimers;

    expect(JSON.stringify(reloadedFirstFocusTimer?.configuration)).toBe(
      '{"task":"Write the release notes","durationMinutes":45}',
    );
    expect(JSON.stringify(reloadedSecondFocusTimer?.configuration)).toBe(
      '{"task":"Plan tomorrow","durationMinutes":15}',
    );

    if (
      reloadedFirstFocusTimer === undefined ||
      reloadedSecondFocusTimer === undefined
    ) {
      throw new Error('Reloaded Focus Timer Widget Instances are missing.');
    }

    reloadedStore.removeWidget(reloadedFirstFocusTimer.id);
    reloadedStore.removeWidget(reloadedSecondFocusTimer.id);

    const persistedWidgets = savedDashboard(storage).widgets;
    expect(persistedWidgets.map((widget) => widget.type)).toEqual(['weather']);
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
      provideRouter([]),
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

function createWeatherAndFocusTimerFixture(
  storage: MemoryStorage,
): Promise<ComponentFixture<DashboardShellComponent>> {
  return createShellFixture(
    storage,
    {
      load: jasmine
        .createSpy('load')
        .and.callFake(async (url: string) =>
          url === WEATHER_MANIFEST_URL
            ? WEATHER_WIDGET_MANIFEST
            : FOCUS_TIMER_WIDGET_MANIFEST,
        ),
    },
    {
      load: jasmine.createSpy('load').and.callFake(async (installation) => {
        for (const tag of [
          installation.elementTag,
          installation.settingsElementTag,
        ]) {
          if (customElements.get(tag) === undefined) {
            customElements.define(tag, class extends JourneyWidgetElement {});
          }
        }
      }),
    },
  );
}

async function installWidget(
  _fixture: ComponentFixture<DashboardShellComponent>,
  manifestUrl: string,
): Promise<void> {
  const result = await TestBed.inject(
    WidgetInstallationService,
  ).installManifest(manifestUrl);

  if (result.status === 'rejected') {
    throw new Error(result.message);
  }

  TestBed.inject(DashboardStore).addWidget({
    type: result.installation.type,
    configuration: result.installation.defaultConfiguration,
    preferredLayout: result.installation.preferredLayout,
  });
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
