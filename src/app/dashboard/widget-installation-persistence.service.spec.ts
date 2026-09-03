import { TestBed } from '@angular/core/testing';
import {
  WIDGET_INSTALLATIONS_STORAGE,
  WIDGET_INSTALLATIONS_STORAGE_KEY,
  WidgetInstallation,
  WidgetInstallationPersistenceService,
} from './widget-installation-persistence.service';
import {
  DASHBOARD_STORAGE,
  DASHBOARD_STORAGE_KEY,
} from './dashboard-persistence.service';
import { MemoryStorage } from '../testing/memory-storage';

describe('WidgetInstallationPersistenceService', () => {
  let storage: MemoryStorage;
  let service: WidgetInstallationPersistenceService;

  beforeEach(() => {
    storage = new MemoryStorage();
    TestBed.configureTestingModule({
      providers: [
        { provide: DASHBOARD_STORAGE, useValue: storage },
        { provide: WIDGET_INSTALLATIONS_STORAGE, useValue: storage },
      ],
    });
    service = TestBed.inject(WidgetInstallationPersistenceService);
  });

  it('stores and restores installations under a key independent from the Dashboard snapshot', () => {
    const installation: WidgetInstallation = {
      manifestUrl: 'https://widgets.example.test/weather/manifest.json',
      manifestVersion: 1,
      type: 'weather',
      displayName: 'Weather',
      version: '1.0.0',
      elementTag: 'trusted-weather-widget',
      entryBundleUrl: 'https://widgets.example.test/weather/entry.js',
      defaultConfiguration: { location: 'Warsaw' },
      preferredLayout: { w: 4, h: 3 },
    };

    expect(service.save([installation])).toBeTrue();
    expect(storage.getItem(DASHBOARD_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(WIDGET_INSTALLATIONS_STORAGE_KEY)).not.toBeNull();

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
          manifestVersion: 1,
          type: 'weather',
          displayName: 'Weather',
          version: '1.0.0',
          elementTag: 'not-a-custom-element',
          entryBundleUrl: 'https://widgets.example.test/weather/entry.js',
          defaultConfiguration: {},
          preferredLayout: { w: 4, h: 3 },
        },
      ],
    });
    storage.setItem(WIDGET_INSTALLATIONS_STORAGE_KEY, savedValue);

    expect(service.load()).toEqual({
      status: 'recovery',
      message: 'Saved Widget Installations are invalid.',
    });
    expect(storage.getItem(WIDGET_INSTALLATIONS_STORAGE_KEY)).toBe(savedValue);
  });
});
