import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { createApplication } from '@angular/platform-browser';
import { DashboardShellComponent } from './dashboard-shell.component';
import {
  DASHBOARD_STORAGE,
  DASHBOARD_STORAGE_KEY,
  DashboardPersistenceService,
} from './dashboard-persistence.service';
import { DashboardStore } from './dashboard.store';
import { WIDGET_INSTALLATIONS_STORAGE_KEY } from './widget-installation-persistence.service';
import {
  WEATHER_DATA_SOURCE,
  type WeatherDataSource,
} from '../../../projects/weather-widget/src/weather-data.service';
import { createWeatherWidgetElement } from '../../../projects/weather-widget/src/weather-widget-element';
import {
  TRUSTED_MANIFEST_ORIGINS,
  WIDGET_ENTRY_BUNDLE_LOADER,
  WIDGET_MANIFEST_SOURCE,
  WidgetEntryBundleLoader,
  WidgetManifestSource,
} from './widget-runtime.service';
import type { WidgetConfiguration } from './dashboard.models';
import { MemoryStorage } from '../testing/memory-storage';

const TRUSTED_ORIGIN = 'https://widgets.example.test';
const MANIFEST_URL = `${TRUSTED_ORIGIN}/weather/manifest.json`;
const VALID_MANIFEST = {
  manifestVersion: 1,
  type: 'weather',
  displayName: 'Weather',
  description: 'Current conditions',
  version: '1.0.0',
  elementTag: 'trusted-weather-widget',
  entryBundleUrl: './entry.js',
  defaultConfiguration: { location: 'Warsaw', units: 'metric' },
  preferredLayout: { w: 4, h: 3 },
};
const WORKING_MANIFEST = {
  ...VALID_MANIFEST,
  type: 'working-widget',
  displayName: 'Working Widget',
  elementTag: 'task-four-working-widget',
  entryBundleUrl: './working.js',
};
const FAILED_MANIFEST = {
  ...VALID_MANIFEST,
  type: 'failed-widget',
  displayName: 'Failed Widget',
  elementTag: 'task-four-failed-widget',
  entryBundleUrl: './failed.js',
};
const MISMATCHED_ELEMENT_MANIFEST = {
  ...VALID_MANIFEST,
  type: 'missing-widget',
  displayName: 'Missing Element Widget',
  elementTag: 'task-four-missing-widget',
  entryBundleUrl: './missing.js',
};

describe('DashboardShellComponent', () => {
  it('installs a trusted manifest and shows it as an available Widget Type', async () => {
    const storage = new MemoryStorage();
    const source: WidgetManifestSource = {
      load: jasmine.createSpy('load').and.resolveTo(VALID_MANIFEST),
    };
    const fixture = await createShellFixture(storage, source);

    submitManifest(fixture, MANIFEST_URL);
    await fixture.whenStable();
    fixture.detectChanges();
    const host = getHost(fixture);

    expect(source.load).toHaveBeenCalledOnceWith(MANIFEST_URL);
    expect(host.textContent).toContain('Weather');
    expect(host.textContent).toContain('Current conditions');
    expect(host.textContent).toContain('weather');
    expect(host.textContent).toContain('1.0.0');
    expect(host.textContent).toContain('trusted-weather-widget');
    expect(host.textContent).toContain('4 × 3');
    expect(
      JSON.parse(storage.getItem(WIDGET_INSTALLATIONS_STORAGE_KEY)!),
    ).toEqual({
      schemaVersion: 1,
      installations: [
        {
          manifestUrl: MANIFEST_URL,
          ...VALID_MANIFEST,
          entryBundleUrl: `${TRUSTED_ORIGIN}/weather/entry.js`,
        },
      ],
    });
    expectEmptyDashboardSnapshot(storage);
  });

  it('rejects a manifest URL from an untrusted origin before reading it', async () => {
    const storage = new MemoryStorage();
    const source: WidgetManifestSource = {
      load: jasmine.createSpy('load'),
    };
    const fixture = await createShellFixture(storage, source, [TRUSTED_ORIGIN]);

    submitManifest(
      fixture,
      'https://untrusted.example.test/weather/manifest.json',
    );
    await fixture.whenStable();
    fixture.detectChanges();
    const host = getHost(fixture);

    expect(source.load).not.toHaveBeenCalled();
    expect(host.textContent).toContain('origin is not trusted');
    expect(storage.getItem(WIDGET_INSTALLATIONS_STORAGE_KEY)).toBeNull();
    expectEmptyDashboardSnapshot(storage);
  });

  it('reports an invalid Widget Manifest URL before reading it', async () => {
    const storage = new MemoryStorage();
    const source: WidgetManifestSource = {
      load: jasmine.createSpy('load'),
    };
    const fixture = await createShellFixture(storage, source, [TRUSTED_ORIGIN]);

    submitManifest(fixture, 'not a URL');
    await fixture.whenStable();
    fixture.detectChanges();
    const host = getHost(fixture);

    expect(source.load).not.toHaveBeenCalled();
    expect(host.textContent).toContain('Enter a valid Widget Manifest URL.');
    expect(storage.getItem(WIDGET_INSTALLATIONS_STORAGE_KEY)).toBeNull();
  });

  it('rejects a malformed Widget Manifest without changing saved state', async () => {
    const storage = new MemoryStorage();
    const source: WidgetManifestSource = {
      load: jasmine.createSpy('load').and.resolveTo({
        manifestVersion: 1,
        type: 'weather',
      }),
    };
    const fixture = await createShellFixture(storage, source);

    submitManifest(fixture, MANIFEST_URL);
    await fixture.whenStable();
    fixture.detectChanges();
    const host = getHost(fixture);

    expect(source.load).toHaveBeenCalledOnceWith(MANIFEST_URL);
    expect(host.textContent).toContain('The Widget Manifest is invalid.');
    expect(storage.getItem(WIDGET_INSTALLATIONS_STORAGE_KEY)).toBeNull();
    expectEmptyDashboardSnapshot(storage);
  });

  it('rejects an unsupported Widget Manifest version without changing saved state', async () => {
    const storage = new MemoryStorage();
    const source: WidgetManifestSource = {
      load: jasmine.createSpy('load').and.resolveTo({ manifestVersion: 2 }),
    };
    const fixture = await createShellFixture(storage, source);

    submitManifest(fixture, MANIFEST_URL);
    await fixture.whenStable();
    fixture.detectChanges();
    const host = getHost(fixture);

    expect(host.textContent).toContain(
      'The Widget Manifest uses an unsupported version.',
    );
    expect(storage.getItem(WIDGET_INSTALLATIONS_STORAGE_KEY)).toBeNull();
    expectEmptyDashboardSnapshot(storage);
  });

  it('reports an unreadable Widget Manifest without changing saved state', async () => {
    const storage = new MemoryStorage();
    const source: WidgetManifestSource = {
      load: jasmine
        .createSpy('load')
        .and.rejectWith(new Error('network unavailable')),
    };
    const fixture = await createShellFixture(storage, source);

    submitManifest(fixture, MANIFEST_URL);
    await fixture.whenStable();
    fixture.detectChanges();
    const host = getHost(fixture);

    expect(host.textContent).toContain(
      'The Widget Manifest could not be read.',
    );
    expect(storage.getItem(WIDGET_INSTALLATIONS_STORAGE_KEY)).toBeNull();
    expectEmptyDashboardSnapshot(storage);
  });

  it('rejects a duplicate Widget Type without replacing the existing installation', async () => {
    const storage = new MemoryStorage();
    const source: WidgetManifestSource = {
      load: jasmine
        .createSpy('load')
        .and.returnValues(
          Promise.resolve(VALID_MANIFEST),
          Promise.resolve({ ...VALID_MANIFEST, version: '2.0.0' }),
        ),
    };
    const fixture = await createShellFixture(storage, source);

    submitManifest(fixture, MANIFEST_URL);
    await fixture.whenStable();
    fixture.detectChanges();
    submitManifest(fixture, `${TRUSTED_ORIGIN}/weather/v2-manifest.json`);
    await fixture.whenStable();
    fixture.detectChanges();
    const host = getHost(fixture);

    expect(source.load).toHaveBeenCalledTimes(2);
    expect(host.textContent).toContain(
      'This Widget Type is already installed.',
    );
    expect(
      host.querySelectorAll('[data-testid="available-widget"]'),
    ).toHaveSize(1);
    expect(
      JSON.parse(storage.getItem(WIDGET_INSTALLATIONS_STORAGE_KEY)!),
    ).toEqual({
      schemaVersion: 1,
      installations: [
        {
          manifestUrl: MANIFEST_URL,
          ...VALID_MANIFEST,
          entryBundleUrl: `${TRUSTED_ORIGIN}/weather/entry.js`,
        },
      ],
    });
  });

  it('rejects a duplicate Manifest URL even when its returned Widget Type changes', async () => {
    const storage = new MemoryStorage();
    const source: WidgetManifestSource = {
      load: jasmine.createSpy('load').and.returnValues(
        Promise.resolve(VALID_MANIFEST),
        Promise.resolve({
          ...VALID_MANIFEST,
          type: 'stocks',
          displayName: 'Stocks',
          elementTag: 'trusted-stocks-widget',
        }),
      ),
    };
    const fixture = await createShellFixture(storage, source);

    submitManifest(fixture, MANIFEST_URL);
    await fixture.whenStable();
    fixture.detectChanges();
    submitManifest(fixture, MANIFEST_URL);
    await fixture.whenStable();
    fixture.detectChanges();
    const host = getHost(fixture);

    expect(host.textContent).toContain(
      'This Widget Manifest is already installed.',
    );
    expect(
      host.querySelectorAll('[data-testid="available-widget"]'),
    ).toHaveSize(1);
  });

  it('rejects a Widget Element tag conflict without replacing the existing installation', async () => {
    const storage = new MemoryStorage();
    const source: WidgetManifestSource = {
      load: jasmine.createSpy('load').and.returnValues(
        Promise.resolve(VALID_MANIFEST),
        Promise.resolve({
          ...VALID_MANIFEST,
          type: 'stocks',
          displayName: 'Stocks',
        }),
      ),
    };
    const fixture = await createShellFixture(storage, source);

    submitManifest(fixture, MANIFEST_URL);
    await fixture.whenStable();
    fixture.detectChanges();
    submitManifest(fixture, `${TRUSTED_ORIGIN}/stocks/manifest.json`);
    await fixture.whenStable();
    fixture.detectChanges();
    const host = getHost(fixture);

    expect(host.textContent).toContain(
      'This Widget Element tag is already assigned to another installed Widget Type.',
    );
    expect(
      host.querySelectorAll('[data-testid="available-widget"]'),
    ).toHaveSize(1);
    expectEmptyDashboardSnapshot(storage);
  });

  it('rejects a manifest whose entry bundle leaves the trusted origin', async () => {
    const storage = new MemoryStorage();
    const source: WidgetManifestSource = {
      load: jasmine.createSpy('load').and.resolveTo({
        ...VALID_MANIFEST,
        entryBundleUrl: 'https://cdn.example.test/weather.js',
      }),
    };
    const fixture = await createShellFixture(storage, source);

    submitManifest(fixture, MANIFEST_URL);
    await fixture.whenStable();
    fixture.detectChanges();
    const host = getHost(fixture);

    expect(host.textContent).toContain(
      'The Widget Manifest points to an untrusted entry bundle.',
    );
    expect(storage.getItem(WIDGET_INSTALLATIONS_STORAGE_KEY)).toBeNull();
    expectEmptyDashboardSnapshot(storage);
  });

  it('restores installations independently from the empty Dashboard snapshot', async () => {
    const storage = new MemoryStorage();
    storage.setItem(
      WIDGET_INSTALLATIONS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        installations: [
          {
            manifestUrl: MANIFEST_URL,
            ...VALID_MANIFEST,
            entryBundleUrl: `${TRUSTED_ORIGIN}/weather/entry.js`,
          },
        ],
      }),
    );
    const source: WidgetManifestSource = {
      load: jasmine.createSpy('load'),
    };
    const fixture = await createShellFixture(storage, source);
    const host = getHost(fixture);

    expect(host.textContent).toContain('Weather');
    expect(
      host.querySelectorAll('[data-testid="available-widget"]'),
    ).toHaveSize(1);
    expect(host.querySelectorAll('.grid-stack-item')).toHaveSize(0);
    expectEmptyDashboardSnapshot(storage);
  });

  it('removes an installation without changing its Widget Instances and makes them unavailable', async () => {
    const storage = new MemoryStorage();
    const dashboard = {
      id: 'e25b6b77-2b4e-4d7e-91df-51feded26e83',
      title: 'Saved dashboard',
      widgets: [
        {
          id: 'f09f1c23-2b6d-4f2d-9ca5-8b7be4a5dd11',
          type: 'weather',
          layout: { x: 2, y: 4, w: 5, h: 4 },
          configuration: { location: 'Kraków', units: 'metric' },
        },
      ],
    };
    const savedSnapshot = JSON.stringify({ schemaVersion: 1, dashboard });
    storage.setItem(DASHBOARD_STORAGE_KEY, savedSnapshot);
    storage.setItem(
      WIDGET_INSTALLATIONS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        installations: [
          {
            manifestUrl: MANIFEST_URL,
            ...VALID_MANIFEST,
            entryBundleUrl: `${TRUSTED_ORIGIN}/weather/entry.js`,
          },
        ],
      }),
    );
    const source: WidgetManifestSource = {
      load: jasmine.createSpy('load'),
    };
    const loader: WidgetEntryBundleLoader = {
      load: jasmine.createSpy('load').and.resolveTo(),
    };
    const fixture = await createShellFixture(
      storage,
      source,
      [TRUSTED_ORIGIN],
      loader,
    );
    await fixture.whenStable();
    fixture.detectChanges();

    const host = getHost(fixture);
    const removeInstallation = host.querySelector<HTMLButtonElement>(
      '[data-testid="remove-widget-installation"]',
    );

    if (removeInstallation === null) {
      throw new Error('The Widget Installation removal control is missing.');
    }

    removeInstallation.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      host.querySelectorAll('[data-testid="available-widget"]'),
    ).toHaveSize(0);
    expect(
      host.querySelectorAll('[data-testid="unavailable-widget"]'),
    ).toHaveSize(1);
    expect(host.textContent).toContain('weather');
    expect(host.textContent).toContain(
      'Existing Widget Instances are now unavailable.',
    );
    expect(storage.getItem(DASHBOARD_STORAGE_KEY)).toBe(savedSnapshot);
    expect(
      JSON.parse(storage.getItem(WIDGET_INSTALLATIONS_STORAGE_KEY)!),
    ).toEqual({ schemaVersion: 1, installations: [] });
  });

  it('contains runtime failures while a functioning installed Widget remains usable', async () => {
    const storage = new MemoryStorage();
    const manifests = new Map<string, typeof VALID_MANIFEST>([
      [`${TRUSTED_ORIGIN}/working/manifest.json`, WORKING_MANIFEST],
      [`${TRUSTED_ORIGIN}/failed/manifest.json`, FAILED_MANIFEST],
      [`${TRUSTED_ORIGIN}/missing/manifest.json`, MISMATCHED_ELEMENT_MANIFEST],
    ]);
    const source: WidgetManifestSource = {
      load: jasmine.createSpy('load').and.callFake((url: string) => {
        const manifest = manifests.get(url);

        if (manifest === undefined) {
          return Promise.reject(new Error('unknown manifest'));
        }

        return Promise.resolve(manifest);
      }),
    };
    const loader: WidgetEntryBundleLoader = {
      load: jasmine.createSpy('load').and.callFake(async (url: string) => {
        if (url.endsWith('/working.js')) {
          if (customElements.get(WORKING_MANIFEST.elementTag) === undefined) {
            customElements.define(
              WORKING_MANIFEST.elementTag,
              class extends HTMLElement {
                #configuration: unknown = null;

                get configuration(): unknown {
                  return this.#configuration;
                }

                set configuration(value: unknown) {
                  this.#configuration = value;
                }

                connectedCallback(): void {
                  this.innerHTML =
                    '<p>Working Widget</p><button type="button" data-testid="working-widget-save">Save working settings</button>';
                  this.querySelector<HTMLButtonElement>(
                    '[data-testid="working-widget-save"]',
                  )?.addEventListener('click', () => {
                    this.dispatchEvent(
                      new CustomEvent('configuration-changed', {
                        bubbles: true,
                        detail: { saved: true },
                      }),
                    );
                  });
                }
              },
            );
          }

          return;
        }

        if (url.endsWith('/failed.js')) {
          throw new Error('bundle unavailable');
        }

        if (url.endsWith('/missing.js')) {
          if (customElements.get('task-four-wrong-widget') === undefined) {
            customElements.define(
              'task-four-wrong-widget',
              class extends HTMLElement {},
            );
          }
        }
      }),
    };
    const fixture = await createShellFixture(
      storage,
      source,
      [TRUSTED_ORIGIN],
      loader,
    );

    for (const manifestUrl of manifests.keys()) {
      submitManifest(fixture, manifestUrl);
      await fixture.whenStable();
      fixture.detectChanges();
    }

    const host = getHost(fixture);
    const addButtons = host.querySelectorAll<HTMLButtonElement>(
      '[data-testid="add-widget"]',
    );

    expect(addButtons).toHaveSize(3);

    for (const addButton of addButtons) {
      addButton.click();
      await fixture.whenStable();
      fixture.detectChanges();
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await fixture.whenStable();
      fixture.detectChanges();
    }

    expect(loader.load).toHaveBeenCalledWith(
      `${TRUSTED_ORIGIN}/working/working.js`,
    );
    expect(loader.load).toHaveBeenCalledWith(
      `${TRUSTED_ORIGIN}/failed/failed.js`,
    );
    expect(loader.load).toHaveBeenCalledWith(
      `${TRUSTED_ORIGIN}/missing/missing.js`,
    );
    expect(
      host.querySelector(
        `[data-testid="widget-element-host"] ${WORKING_MANIFEST.elementTag}`,
      ),
    ).not.toBeNull();
    expect(
      host.querySelectorAll('[data-testid="unavailable-widget"]'),
    ).toHaveSize(2);
    expect(host.querySelectorAll('.grid-stack-item')).toHaveSize(3);

    const availableWidgets = [
      ...host.querySelectorAll<HTMLElement>('[data-testid="available-widget"]'),
    ];
    const failedWidget = availableWidgets.find((widget) =>
      widget.textContent?.includes('Failed Widget'),
    );

    expect(failedWidget).not.toBeUndefined();

    const removeInstallation = failedWidget?.querySelector<HTMLButtonElement>(
      '[data-testid="remove-widget-installation"]',
    );

    if (removeInstallation === null || removeInstallation === undefined) {
      throw new Error(
        'The failed Widget Installation removal control is missing.',
      );
    }

    removeInstallation.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      host.querySelectorAll('[data-testid="available-widget"]'),
    ).toHaveSize(2);
    expect(
      host.querySelectorAll('[data-testid="unavailable-widget"]'),
    ).toHaveSize(2);
    expect(
      host.querySelector(
        `[data-testid="widget-element-host"] ${WORKING_MANIFEST.elementTag}`,
      ),
    ).not.toBeNull();

    const workingSave = host.querySelector<HTMLButtonElement>(
      '[data-testid="working-widget-save"]',
    );

    if (workingSave === null) {
      throw new Error('The functioning Widget settings control is missing.');
    }

    workingSave.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      JSON.parse(storage.getItem(DASHBOARD_STORAGE_KEY)!).dashboard.widgets[0]
        .configuration,
    ).toEqual({ saved: true });

    const unavailableWidgets = [
      ...host.querySelectorAll<HTMLElement>(
        '[data-testid="unavailable-widget"]',
      ),
    ];
    const failedUnavailableWidget = unavailableWidgets.find((widget) =>
      widget.textContent?.includes('failed-widget'),
    );
    const removeUnavailableWidget =
      failedUnavailableWidget?.querySelector<HTMLButtonElement>(
        '[data-testid="remove-unavailable-widget"]',
      );

    if (
      failedUnavailableWidget === undefined ||
      removeUnavailableWidget === null ||
      removeUnavailableWidget === undefined
    ) {
      throw new Error('The unavailable Widget removal control is missing.');
    }

    removeUnavailableWidget.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      host.querySelectorAll('[data-testid="unavailable-widget"]'),
    ).toHaveSize(1);
    expect(host.querySelectorAll('.grid-stack-item')).toHaveSize(2);
    expect(
      host.querySelector(
        `[data-testid="widget-element-host"] ${WORKING_MANIFEST.elementTag}`,
      ),
    ).not.toBeNull();
    expect(
      JSON.parse(storage.getItem(DASHBOARD_STORAGE_KEY)!).dashboard.widgets,
    ).toHaveSize(2);
  });

  it('leaves an existing Dashboard untouched when installation is rejected', async () => {
    const storage = new MemoryStorage();
    const dashboard = {
      id: 'e25b6b77-2b4e-4d7e-91df-51feded26e83',
      title: 'Saved dashboard',
      widgets: [
        {
          id: 'f09f1c23-2b6d-4f2d-9ca5-8b7be4a5dd11',
          type: 'legacy-widget',
          layout: { x: 1, y: 2, w: 3, h: 2 },
          configuration: { title: 'Keep me' },
        },
      ],
    };
    const savedSnapshot = JSON.stringify({ schemaVersion: 1, dashboard });
    storage.setItem(DASHBOARD_STORAGE_KEY, savedSnapshot);
    const source: WidgetManifestSource = {
      load: jasmine.createSpy('load').and.resolveTo({ manifestVersion: 2 }),
    };
    const fixture = await createShellFixture(storage, source);

    submitManifest(fixture, MANIFEST_URL);
    await fixture.whenStable();
    fixture.detectChanges();
    const host = getHost(fixture);

    expect(host.textContent).toContain(
      'The Widget Manifest uses an unsupported version.',
    );
    expect(storage.getItem(DASHBOARD_STORAGE_KEY)).toBe(savedSnapshot);
    expect(host.querySelectorAll('.grid-stack-item')).toHaveSize(1);
    expect(host.textContent).toContain('Keep me');
  });

  it('adds, renders, and persists a Widget Element configuration replacement', async () => {
    const storage = new MemoryStorage();
    const weatherSource: WeatherDataSource = {
      read: jasmine.createSpy('read').and.resolveTo({
        location: 'Warsaw',
        temperature: 21.5,
        temperatureUnit: '°C',
        humidity: 55,
        weatherCode: 1,
      }),
    };
    const weatherApplication = await createApplication({
      providers: [
        provideZonelessChangeDetection(),
        { provide: WEATHER_DATA_SOURCE, useValue: weatherSource },
      ],
    });
    const loader: WidgetEntryBundleLoader = {
      load: jasmine.createSpy('load').and.callFake(async () => {
        if (customElements.get('trusted-weather-widget') === undefined) {
          customElements.define(
            'trusted-weather-widget',
            createWeatherWidgetElement(Promise.resolve(weatherApplication)),
          );
        }
      }),
    };
    const source: WidgetManifestSource = {
      load: jasmine.createSpy('load').and.resolveTo(VALID_MANIFEST),
    };
    const fixture = await createShellFixture(
      storage,
      source,
      [TRUSTED_ORIGIN],
      loader,
    );

    submitManifest(fixture, MANIFEST_URL);
    await fixture.whenStable();
    fixture.detectChanges();
    getHost(fixture)
      .querySelector<HTMLButtonElement>('[data-testid="add-widget"]')
      ?.click();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = getHost(fixture);
    const widgetElement = host.querySelector<
      HTMLElement & {
        configuration: WidgetConfiguration;
      }
    >('[data-testid="widget-element-host"] trusted-weather-widget');

    expect(loader.load).toHaveBeenCalledOnceWith(
      `${TRUSTED_ORIGIN}/weather/entry.js`,
    );
    expect(host.querySelectorAll('.grid-stack-item')).toHaveSize(1);
    expect(widgetElement).not.toBeNull();
    expect(JSON.stringify(widgetElement?.configuration)).toBe(
      '{"location":"Warsaw","units":"metric"}',
    );
    await waitForWeatherWidgetElement();

    const location = widgetElement?.querySelector<HTMLInputElement>('input');
    const form = widgetElement?.querySelector<HTMLFormElement>('form');

    if (
      location === null ||
      location === undefined ||
      form === null ||
      form === undefined
    ) {
      throw new Error('Weather Widget Element settings form is missing.');
    }

    location.value = 'Kraków';
    location.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(
      new SubmitEvent('submit', { bubbles: true, cancelable: true }),
    );
    await fixture.whenStable();
    fixture.detectChanges();
    await waitForWeatherWidgetElement();

    const updatedConfiguration: WidgetConfiguration = {
      location: 'Kraków',
      units: 'metric',
    };

    expect(
      JSON.parse(storage.getItem(DASHBOARD_STORAGE_KEY)!).dashboard.widgets[0]
        .configuration,
    ).toEqual(updatedConfiguration);
    expect(widgetElement?.configuration).toEqual(updatedConfiguration);

    const reloadedStore = new DashboardStore(
      TestBed.inject(DashboardPersistenceService),
    );
    expect(
      JSON.stringify(reloadedStore.dashboard()?.widgets[0].configuration),
    ).toBe('{"location":"Kraków","units":"metric"}');
    weatherApplication.destroy();
  });
});

async function createShellFixture(
  storage: MemoryStorage,
  source: WidgetManifestSource,
  trustedOrigins: readonly string[] = [TRUSTED_ORIGIN],
  loader?: WidgetEntryBundleLoader,
): Promise<ComponentFixture<DashboardShellComponent>> {
  await TestBed.configureTestingModule({
    imports: [DashboardShellComponent],
    providers: [
      provideZonelessChangeDetection(),
      { provide: DASHBOARD_STORAGE, useValue: storage },
      { provide: TRUSTED_MANIFEST_ORIGINS, useValue: trustedOrigins },
      { provide: WIDGET_MANIFEST_SOURCE, useValue: source },
      ...(loader === undefined
        ? []
        : [{ provide: WIDGET_ENTRY_BUNDLE_LOADER, useValue: loader }]),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(DashboardShellComponent);
  fixture.detectChanges();
  return fixture;
}

function submitManifest(
  fixture: ComponentFixture<DashboardShellComponent>,
  url: string,
): void {
  const host = getHost(fixture);
  const input = host.querySelector<HTMLInputElement>(
    '[data-testid="manifest-url"]',
  );
  const form = host.querySelector<HTMLFormElement>(
    '[data-testid="install-widget-form"]',
  );

  if (input === null || form === null) {
    throw new Error('The Widget Manifest installation controls are missing.');
  }

  input.value = url;
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

function expectEmptyDashboardSnapshot(storage: MemoryStorage): void {
  expect(JSON.parse(storage.getItem(DASHBOARD_STORAGE_KEY)!)).toEqual({
    schemaVersion: 1,
    dashboard: {
      id: 'e25b6b77-2b4e-4d7e-91df-51feded26e83',
      title: 'My dashboard',
      widgets: [],
    },
  });
}

function waitForWeatherWidgetElement(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}
