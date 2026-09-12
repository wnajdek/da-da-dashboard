import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MemoryStorage } from '../../testing/memory-storage';
import { DASHBOARD_STORAGE } from '../workspace/dashboard-persistence.service';
import {
  WidgetInstallationPersistenceService,
  provideWidgetInstallationPersistence,
} from './widget-installation-persistence.service';
import type { WidgetInstallation } from './widget-installation.models';
import {
  WIDGET_MANIFEST_SOURCE,
  type WidgetManifestSource,
} from './widget-manifest-source';
import { WidgetInstallationService } from './widget-installation.service';
import { TRUSTED_MANIFEST_ORIGINS } from './widget-trust-policy';

describe('WidgetInstallationService', () => {
  const installation: WidgetInstallation = {
    manifestUrl: 'https://widgets.example.test/weather/manifest.json',
    manifestVersion: 2,
    type: 'weather',
    displayName: 'Weather',
    version: '1.0.0',
    elementTag: 'installation-weather-widget',
    settingsElementTag: 'installation-weather-widget-settings',
    entryBundleUrl: 'https://widgets.example.test/weather/entry.js',
    defaultConfiguration: { location: 'Warsaw', units: 'metric' },
    preferredLayout: { w: 4, h: 3 },
  };

  it('installs a trusted manifest and returns caller-ready feedback', async () => {
    const source: WidgetManifestSource = {
      load: jasmine.createSpy('load').and.resolveTo({
        manifestVersion: 2,
        type: 'weather',
        displayName: 'Weather',
        version: '1.0.0',
        elementTag: 'installation-weather-widget',
        settingsElementTag: 'installation-weather-widget-settings',
        entryBundleUrl: './entry.js',
        defaultConfiguration: { location: 'Warsaw', units: 'metric' },
        preferredLayout: { w: 4, h: 3 },
      }),
    };
    configure(source);
    const installations = TestBed.inject(WidgetInstallationService);

    const result = await installations.installManifest(
      installation.manifestUrl,
    );

    expect(result).toEqual({
      status: 'installed',
      installation,
      message: 'Installed “Weather”.',
    });
    expect(installations.installations()).toEqual([installation]);
  });

  it('keeps an installation available when removal cannot be persisted', () => {
    const storage = new MemoryStorage();
    configure({ load: jasmine.createSpy('load') }, storage);
    expect(
      TestBed.inject(WidgetInstallationPersistenceService).save([installation]),
    ).toBeTrue();
    const installations = TestBed.inject(WidgetInstallationService);
    spyOn(storage, 'setItem').and.throwError('storage unavailable');

    const result = installations.removeInstallation(installation.type);

    expect(result).toEqual({
      status: 'rejected',
      message: 'The Widget Installation could not be removed locally.',
    });
    expect(installations.installations()).toEqual([installation]);
  });

  it('blocks installation and uninstalling until damaged installation data is reset', async () => {
    const storage = new MemoryStorage();
    storage.setItem('configurable-dashboard.widget-installations', '{');
    const source: WidgetManifestSource = {
      load: jasmine.createSpy('load'),
    };
    configure(source, storage);
    const installations = TestBed.inject(WidgetInstallationService);

    expect(installations.recoveryMessage()).toBe(
      'Saved Widget Installations could not be read.',
    );
    await expectAsync(
      installations.installManifest(installation.manifestUrl),
    ).toBeResolvedTo({
      status: 'rejected',
      message: 'Reset installed Widgets before making changes.',
    });
    expect(installations.removeInstallation(installation.type)).toEqual({
      status: 'rejected',
      message: 'Reset installed Widgets before making changes.',
    });
    expect(source.load).not.toHaveBeenCalled();

    expect(installations.resetInstallations()).toEqual({
      status: 'reset',
      message: 'Installed Widgets were reset.',
    });
    expect(installations.recoveryMessage()).toBeNull();
    expect(installations.installations()).toEqual([]);
  });
});

function configure(
  source: WidgetManifestSource,
  storage = new MemoryStorage(),
): void {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: DASHBOARD_STORAGE, useValue: storage },
      {
        provide: TRUSTED_MANIFEST_ORIGINS,
        useValue: ['https://widgets.example.test'],
      },
      { provide: WIDGET_MANIFEST_SOURCE, useValue: source },
      provideWidgetInstallationPersistence(),
    ],
  });
}
