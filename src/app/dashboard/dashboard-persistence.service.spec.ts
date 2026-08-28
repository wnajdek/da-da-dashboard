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

  it('loads a valid version one snapshot', () => {
    const dashboard = createSeedDashboard();
    storage.setItem(
      'configurable-dashboard.snapshot',
      JSON.stringify({ schemaVersion: 1, dashboard }),
    );

    expect(service.load()).toEqual({ status: 'ready', dashboard });
  });

  it('rejects malformed and unsupported snapshots without replacing them', () => {
    storage.setItem('configurable-dashboard.snapshot', '{not JSON');

    expect(service.load()).toEqual({
      status: 'recovery',
      message: 'The saved Dashboard could not be read.',
    });
    expect(storage.getItem('configurable-dashboard.snapshot')).toBe(
      '{not JSON',
    );

    storage.setItem(
      'configurable-dashboard.snapshot',
      JSON.stringify({ schemaVersion: 2, dashboard: createSeedDashboard() }),
    );

    expect(service.load()).toEqual({
      status: 'recovery',
      message: 'The saved Dashboard uses an unsupported version.',
    });

    storage.setItem(
      'configurable-dashboard.snapshot',
      JSON.stringify({ schemaVersion: 1, dashboard: {} }),
    );

    expect(service.load()).toEqual({
      status: 'recovery',
      message: 'The saved Dashboard is invalid.',
    });

    storage.setItem(
      'configurable-dashboard.snapshot',
      JSON.stringify({
        schemaVersion: 1,
        dashboard: { ...createSeedDashboard(), id: 'not-a-uuid' },
      }),
    );

    expect(service.load()).toEqual({
      status: 'recovery',
      message: 'The saved Dashboard is invalid.',
    });

    storage.setItem(
      'configurable-dashboard.snapshot',
      JSON.stringify({
        schemaVersion: 1,
        dashboard: {
          ...createSeedDashboard(),
          widgets: [{ ...createSeedDashboard().widgets[0], id: 'not-a-uuid' }],
        },
      }),
    );

    expect(service.load()).toEqual({
      status: 'recovery',
      message: 'The saved Dashboard is invalid.',
    });
  });
});
