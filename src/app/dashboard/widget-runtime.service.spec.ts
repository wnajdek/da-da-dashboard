import { TestBed } from '@angular/core/testing';
import {
  TRUSTED_MANIFEST_ORIGINS,
  WIDGET_ENTRY_BUNDLE_LOADER,
  WidgetEntryBundleLoader,
  WidgetRuntimeService,
} from './widget-runtime.service';
import { DASHBOARD_STORAGE } from './dashboard-persistence.service';
import {
  WIDGET_INSTALLATIONS_STORAGE,
  WIDGET_INSTALLATIONS_STORAGE_KEY,
} from './widget-installation-persistence.service';
import { MemoryStorage } from '../testing/memory-storage';
import type { WidgetInstallation } from './widget-installation-persistence.service';

describe('WidgetRuntimeService', () => {
  const installation: WidgetInstallation = {
    manifestUrl: 'https://widgets.example.test/weather/manifest.json',
    manifestVersion: 1,
    type: 'weather',
    displayName: 'Weather',
    version: '1.0.0',
    elementTag: 'runtime-weather-widget',
    entryBundleUrl: 'https://widgets.example.test/weather/entry.js',
    defaultConfiguration: { location: 'Warsaw', units: 'metric' },
    preferredLayout: { w: 4, h: 3 },
  };

  it('loads an entry bundle once and requires its declared Widget Element', async () => {
    const storage = new MemoryStorage();
    const loader: WidgetEntryBundleLoader = {
      load: jasmine.createSpy('load').and.callFake(async () => {
        customElements.define(
          installation.elementTag,
          class extends HTMLElement {},
        );
      }),
    };
    configure(storage, loader);
    const runtime = TestBed.inject(WidgetRuntimeService);

    await runtime.loadElement(installation);
    await runtime.loadElement(installation);

    expect(loader.load).toHaveBeenCalledOnceWith(installation.entryBundleUrl);
    expect(customElements.get(installation.elementTag)).toBeDefined();
  });

  it('fails when the entry bundle does not register the declared Widget Element', async () => {
    const storage = new MemoryStorage();
    const loader: WidgetEntryBundleLoader = {
      load: jasmine.createSpy('load').and.resolveTo(),
    };
    configure(storage, loader);
    const runtime = TestBed.inject(WidgetRuntimeService);

    await expectAsync(
      runtime.loadElement({
        ...installation,
        elementTag: 'missing-runtime-weather-widget',
      }),
    ).toBeRejectedWithError(/did not register/);
  });

  it('does not execute a restored installation after its origin is removed from the allowlist', async () => {
    const loader: WidgetEntryBundleLoader = {
      load: jasmine.createSpy('load').and.resolveTo(),
    };
    configure(new MemoryStorage(), loader, []);
    const runtime = TestBed.inject(WidgetRuntimeService);

    await expectAsync(runtime.loadElement(installation)).toBeRejectedWithError(
      /no longer trusted/,
    );
    expect(loader.load).not.toHaveBeenCalled();
  });

  it('removes an installation while keeping the persisted installation snapshot valid', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      WIDGET_INSTALLATIONS_STORAGE_KEY,
      JSON.stringify({ schemaVersion: 1, installations: [installation] }),
    );
    configure(storage, { load: jasmine.createSpy('load') });
    const runtime = TestBed.inject(WidgetRuntimeService);

    const result = runtime.removeInstallation(installation.type);

    expect(result).toEqual({ status: 'removed', installation });
    expect(runtime.installations()).toEqual([]);
    expect(storage.getItem(WIDGET_INSTALLATIONS_STORAGE_KEY)).toBe(
      JSON.stringify({ schemaVersion: 1, installations: [] }),
    );
    expect(runtime.feedback()).toEqual({
      status: 'success',
      message:
        'Removed “Weather”. Existing Widget Instances are now unavailable.',
    });
  });

  it('keeps an installation available when its removal cannot be persisted', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      WIDGET_INSTALLATIONS_STORAGE_KEY,
      JSON.stringify({ schemaVersion: 1, installations: [installation] }),
    );
    configure(storage, { load: jasmine.createSpy('load') });
    const runtime = TestBed.inject(WidgetRuntimeService);
    spyOn(storage, 'setItem').and.throwError('storage unavailable');

    const result = runtime.removeInstallation(installation.type);

    expect(result).toEqual({
      status: 'rejected',
      message: 'The Widget Installation could not be removed locally.',
    });
    expect(runtime.installations()).toEqual([installation]);
    expect(runtime.feedback()).toEqual({
      status: 'error',
      message: 'The Widget Installation could not be removed locally.',
    });
  });
});

function configure(
  storage: MemoryStorage,
  loader: WidgetEntryBundleLoader,
  trustedOrigins: readonly string[] = ['https://widgets.example.test'],
): void {
  TestBed.configureTestingModule({
    providers: [
      { provide: DASHBOARD_STORAGE, useValue: storage },
      { provide: TRUSTED_MANIFEST_ORIGINS, useValue: trustedOrigins },
      { provide: WIDGET_ENTRY_BUNDLE_LOADER, useValue: loader },
      { provide: WIDGET_INSTALLATIONS_STORAGE, useValue: storage },
    ],
  });
}
