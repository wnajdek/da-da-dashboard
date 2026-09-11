import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { WidgetInstallationPersistenceService } from './widget-installation-persistence.service';
import {
  DASHBOARD_STORAGE,
  DASHBOARD_STORAGE_KEY,
} from '../workspace/dashboard-persistence.service';
import { MemoryStorage } from '../../testing/memory-storage';
import type { WidgetInstallation } from './widget-installation.models';

describe('WidgetInstallationPersistenceService', () => {
  let storage: MemoryStorage;
  let service: WidgetInstallationPersistenceService;

  beforeEach(() => {
    storage = new MemoryStorage();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: DASHBOARD_STORAGE, useValue: storage },
      ],
    });
    service = TestBed.inject(WidgetInstallationPersistenceService);
  });

  it('stores and restores installations under a key independent from the Dashboard snapshot', () => {
    const installation: WidgetInstallation = {
      manifestUrl: 'https://widgets.example.test/weather/manifest.json',
      manifestVersion: 2,
      type: 'weather',
      displayName: 'Weather',
      version: '1.0.0',
      elementTag: 'trusted-weather-widget',
      settingsElementTag: 'trusted-weather-widget-settings',
      entryBundleUrl: 'https://widgets.example.test/weather/entry.js',
      defaultConfiguration: { location: 'Warsaw' },
      preferredLayout: { w: 4, h: 3 },
    };

    expect(service.save([installation])).toBeTrue();
    expect(storage.getItem(DASHBOARD_STORAGE_KEY)).toBeNull();
    expect(storage.length).toBe(1);

    const result = service.load();

    expect(result.status).toBe('ready');

    if (result.status !== 'ready') {
      return;
    }

    expect(result.installations as unknown).toEqual([installation]);
  });

  it('keeps malformed installation data in recovery instead of replacing it', () => {
    const savedValue = JSON.stringify({
      schemaVersion: 1,
      installations: [
        {
          manifestUrl: 'https://widgets.example.test/weather/manifest.json',
          manifestVersion: 2,
          type: 'weather',
          displayName: 'Weather',
          version: '1.0.0',
          elementTag: 'notacustomelement',
          settingsElementTag: 'weather-widget-settings',
          entryBundleUrl: 'https://widgets.example.test/weather/entry.js',
          defaultConfiguration: {},
          preferredLayout: { w: 4, h: 3 },
        },
      ],
    });
    expect(service.save([])).toBeTrue();
    const storageKey = storage.key(0);

    if (storageKey === null) {
      throw new Error(
        'Widget Installation persistence did not create storage.',
      );
    }

    storage.setItem(storageKey, savedValue);

    expect(service.load()).toEqual({
      status: 'recovery',
      message: 'Saved Widget Installations are invalid.',
    });
    expect(storage.getItem(storageKey)).toBe(savedValue);
  });
});
