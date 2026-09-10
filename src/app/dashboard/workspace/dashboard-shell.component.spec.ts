import {
  ApplicationRef,
  EnvironmentInjector,
  createComponent,
  createEnvironmentInjector,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardShellComponent } from './dashboard-shell.component';
import {
  DASHBOARD_STORAGE,
  DASHBOARD_STORAGE_KEY,
  DashboardPersistenceService,
} from './dashboard-persistence.service';
import { DashboardStore } from './dashboard.store';
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
const WIDGET_ELEMENT_TAG = 'dashboard-journey-widget';
const WIDGET_MANIFEST = {
  manifestVersion: 1 as const,
  type: 'continuity-widget',
  displayName: 'Continuity Widget',
  version: '1.0.0',
  elementTag: WIDGET_ELEMENT_TAG,
  entryBundleUrl: './continuity.js',
  defaultConfiguration: { location: 'Warsaw', units: 'metric' },
  preferredLayout: { w: 4, h: 3 },
};

describe('DashboardShellComponent', () => {
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

  it('persists the trusted Widget journey through configuration, layout, removal, undo, and reload', async () => {
    const storage = new MemoryStorage();
    const fixture = await createShellFixture(
      storage,
      { load: jasmine.createSpy('load').and.resolveTo(WIDGET_MANIFEST) },
      {
        load: jasmine.createSpy('load').and.callFake(async () => {
          if (customElements.get(WIDGET_ELEMENT_TAG) === undefined) {
            customElements.define(WIDGET_ELEMENT_TAG, JourneyWidgetElement);
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
    await waitForBrowserRender();
    fixture.detectChanges();

    const host = getHost(fixture);
    const widgetElement = host.querySelector<JourneyWidgetElement>(
      `[data-testid="widget-element-host"] ${WIDGET_ELEMENT_TAG}`,
    );
    if (widgetElement === null) {
      throw new Error(
        'The trusted Widget journey did not render its Widget Element.',
      );
    }

    TestBed.inject(DashboardStore).addWidget({
      type: 'unavailable-widget',
      configuration: {},
      preferredLayout: { w: 4, h: 3 },
    });
    await render(fixture);

    expect(
      host.querySelector(
        `[data-testid="widget-element-host"] ${WIDGET_ELEMENT_TAG}`,
      ),
    ).not.toBeNull();
    expect(
      host.querySelectorAll('[data-testid="unavailable-widget"]'),
    ).toHaveSize(1);

    widgetElement.dispatchEvent(
      new CustomEvent('configuration-changed', {
        bubbles: true,
        detail: { location: 'Kraków', units: 'metric' },
      }),
    );
    const widgetId = savedDashboard(storage).widgets[0].id;
    TestBed.inject(DashboardStore).commitGridLayoutChange([
      { id: widgetId, layout: { x: 3, y: 0, w: 6, h: 4 } },
    ]);
    await render(fixture);

    const savedWidget = savedDashboard(storage).widgets[0];
    expect(savedWidget.layout).toEqual({ x: 3, y: 0, w: 6, h: 4 });
    expect(JSON.stringify(savedWidget.configuration)).toBe(
      '{"location":"Kraków","units":"metric"}',
    );

    host
      .querySelector<HTMLButtonElement>(
        '[data-testid="remove-widget-instance"]',
      )
      ?.click();
    await render(fixture);
    host
      .querySelector<HTMLButtonElement>('[data-testid="undo-removal"]')
      ?.click();
    await render(fixture);

    expect(savedDashboard(storage).widgets).toEqual([
      savedWidget,
      jasmine.objectContaining({ type: 'unavailable-widget' }),
    ]);

    fixture.destroy();
    const reloaded = await renderReloadedShell();

    try {
      expect(
        JSON.stringify(
          reloaded.host.querySelector<JourneyWidgetElement>(
            `[data-testid="widget-element-host"] ${WIDGET_ELEMENT_TAG}`,
          )?.configuration,
        ),
      ).toBe('{"location":"Kraków","units":"metric"}');
      expect(
        reloaded.host.querySelector('.grid-stack-item')?.getAttribute('gs-x'),
      ).toBe('3');
    } finally {
      reloaded.destroy();
    }
  });
});

class JourneyWidgetElement extends HTMLElement {
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

async function render(
  fixture: ComponentFixture<DashboardShellComponent>,
): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
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

async function renderReloadedShell(): Promise<{
  readonly host: HTMLElement;
  readonly destroy: () => void;
}> {
  const parentInjector = TestBed.inject(EnvironmentInjector);
  const reloadedInjector = createEnvironmentInjector(
    [{ provide: DashboardStore, useFactory: () => new DashboardStore() }],
    parentInjector,
    'Dashboard Shell journey reload',
  );
  const applicationRef = TestBed.inject(ApplicationRef);
  const host = document.createElement('div');
  const component = createComponent(DashboardShellComponent, {
    environmentInjector: reloadedInjector,
    hostElement: host,
  });
  document.body.append(host);
  applicationRef.attachView(component.hostView);
  component.changeDetectorRef.detectChanges();
  await waitForBrowserRender();
  component.changeDetectorRef.detectChanges();

  return {
    host,
    destroy: () => {
      applicationRef.detachView(component.hostView);
      component.destroy();
      reloadedInjector.destroy();
      host.remove();
    },
  };
}
