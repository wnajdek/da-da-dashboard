import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { WidgetInstallation } from './widget-installation.models';
import {
  WIDGET_ELEMENT_REGISTRY,
  WIDGET_ENTRY_BUNDLE_LOADER,
  type WidgetElementRegistry,
  type WidgetEntryBundleLoader,
} from './widget-element-browser.adapters';
import { WidgetElementLoaderService } from './widget-element-loader.service';
import { TRUSTED_MANIFEST_ORIGINS } from './widget-trust-policy';

describe('WidgetElementLoaderService', () => {
  const installation: WidgetInstallation = {
    manifestUrl: 'https://widgets.example.test/weather/manifest.json',
    manifestVersion: 1,
    type: 'weather',
    displayName: 'Weather',
    version: '1.0.0',
    elementTag: 'loader-weather-widget',
    entryBundleUrl: 'https://widgets.example.test/weather/entry.js',
    defaultConfiguration: { location: 'Warsaw', units: 'metric' },
    preferredLayout: { w: 4, h: 3 },
  };

  it('loads an entry bundle once and requires its declared Widget Element', async () => {
    const registeredTags = new Set<string>();
    const loader: WidgetEntryBundleLoader = {
      load: jasmine.createSpy('load').and.callFake(async () => {
        registeredTags.add(installation.elementTag);
      }),
    };
    configure(loader, { isRegistered: (tag) => registeredTags.has(tag) });
    const elementLoader = TestBed.inject(WidgetElementLoaderService);

    await elementLoader.load(installation);
    await elementLoader.load(installation);

    expect(loader.load).toHaveBeenCalledOnceWith(installation.entryBundleUrl);
  });

  it('shares an in-flight entry bundle load between Widget Element requests', async () => {
    const registeredTags = new Set<string>();
    let finishLoading: (() => void) | undefined;
    const loader: WidgetEntryBundleLoader = {
      load: jasmine.createSpy('load').and.callFake(
        () =>
          new Promise<void>((resolve) => {
            finishLoading = () => {
              registeredTags.add(installation.elementTag);
              resolve();
            };
          }),
      ),
    };
    configure(loader, { isRegistered: (tag) => registeredTags.has(tag) });
    const elementLoader = TestBed.inject(WidgetElementLoaderService);

    const firstLoad = elementLoader.load(installation);
    const secondLoad = elementLoader.load(installation);

    expect(loader.load).toHaveBeenCalledOnceWith(installation.entryBundleUrl);
    if (finishLoading === undefined) {
      throw new Error('The Widget Element entry bundle did not begin loading.');
    }

    finishLoading();
    await Promise.all([firstLoad, secondLoad]);
  });

  it('fails when the entry bundle does not register the declared Widget Element', async () => {
    const loader: WidgetEntryBundleLoader = {
      load: jasmine.createSpy('load').and.resolveTo(),
    };
    configure(loader, { isRegistered: () => false });
    const elementLoader = TestBed.inject(WidgetElementLoaderService);

    await expectAsync(elementLoader.load(installation)).toBeRejectedWithError(
      /did not register/,
    );
  });

  it('does not execute a restored installation after its origin is removed from the allowlist', async () => {
    const loader: WidgetEntryBundleLoader = {
      load: jasmine.createSpy('load').and.resolveTo(),
    };
    configure(loader, { isRegistered: () => false }, []);
    const elementLoader = TestBed.inject(WidgetElementLoaderService);

    await expectAsync(elementLoader.load(installation)).toBeRejectedWithError(
      /no longer trusted/,
    );
    expect(loader.load).not.toHaveBeenCalled();
  });
});

function configure(
  loader: WidgetEntryBundleLoader,
  registry: WidgetElementRegistry,
  trustedOrigins: readonly string[] = ['https://widgets.example.test'],
): void {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: TRUSTED_MANIFEST_ORIGINS, useValue: trustedOrigins },
      { provide: WIDGET_ENTRY_BUNDLE_LOADER, useValue: loader },
      { provide: WIDGET_ELEMENT_REGISTRY, useValue: registry },
    ],
  });
}
