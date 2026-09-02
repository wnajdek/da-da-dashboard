import { TestBed } from '@angular/core/testing';
import {
  DASHBOARD_STORAGE,
  DashboardPersistenceService,
} from './dashboard-persistence.service';
import { createSeedDashboard } from './dashboard.seed';
import { MemoryStorage } from '../testing/memory-storage';

describe('DashboardPersistenceService', () => {
  let storage: MemoryStorage;
  let service: DashboardPersistenceService;

  beforeEach(() => {
    storage = new MemoryStorage();
    TestBed.configureTestingModule({
      providers: [{ provide: DASHBOARD_STORAGE, useValue: storage }],
    });
    service = TestBed.inject(DashboardPersistenceService);
  });

  it('loads a valid version one snapshot with an opaque Widget Configuration', () => {
    const dashboard = {
      ...createSeedDashboard(),
      widgets: [
        {
          id: 'f09f1c23-2b6d-4f2d-9ca5-8b7be4a5dd11',
          type: 'example-widget',
          layout: { x: 0, y: 0, w: 3, h: 2 },
          configuration: { location: 'Warsaw', units: 'metric' },
        },
      ],
    };
    storage.setItem(
      'configurable-dashboard.snapshot',
      JSON.stringify({ schemaVersion: 1, dashboard }),
    );

    expect(service.load()).toEqual({ status: 'ready', dashboard });
  });

  it('rejects a Widget with malformed structure or non-JSON configuration', () => {
    const dashboard = createSeedDashboard();
    storage.setItem(
      'configurable-dashboard.snapshot',
      JSON.stringify({
        schemaVersion: 1,
        dashboard: {
          ...dashboard,
          widgets: [
            {
              id: 'f09f1c23-2b6d-4f2d-9ca5-8b7be4a5dd11',
              type: 'example-widget',
              layout: { x: 0, y: 0, w: 0, h: 2 },
              configuration: {},
            },
          ],
        },
      }),
    );

    expect(service.load()).toEqual({
      status: 'recovery',
      message: 'The saved Dashboard is invalid.',
    });
  });
});
