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

  it('loads a structurally valid snapshot with an unavailable Widget Type', () => {
    const dashboard = createSeedDashboard();
    const unavailableWidget = {
      id: 'f09f1c23-2b6d-4f2d-9ca5-8b7be4a5dd11',
      type: 'weather',
      layout: { x: 0, y: 3, w: 4, h: 2 },
      configuration: {
        location: 'Warsaw',
      },
    };
    const savedDashboard = {
      ...dashboard,
      widgets: [unavailableWidget, ...dashboard.widgets],
    };

    storage.setItem(
      'configurable-dashboard.snapshot',
      JSON.stringify({ schemaVersion: 1, dashboard: savedDashboard }),
    );

    const result = service.load();

    expect(result.status).toBe('ready');
    if (result.status === 'ready') {
      expect(result.dashboard.widgets[0]).toEqual(
        jasmine.objectContaining(unavailableWidget),
      );
    }
  });

  it('rejects an unavailable Widget with malformed structure', () => {
    const dashboard = createSeedDashboard();
    const malformedUnavailableWidget = {
      id: 'f09f1c23-2b6d-4f2d-9ca5-8b7be4a5dd11',
      type: 'weather',
      layout: { x: 0, y: 3, w: 0, h: 2 },
      configuration: { title: 'Local weather' },
    };
    storage.setItem(
      'configurable-dashboard.snapshot',
      JSON.stringify({
        schemaVersion: 1,
        dashboard: {
          ...dashboard,
          widgets: [malformedUnavailableWidget],
        },
      }),
    );

    expect(service.load()).toEqual({
      status: 'recovery',
      message: 'The saved Dashboard is invalid.',
    });
  });

  it('rejects duplicate Widget Instance IDs even when their types are unavailable', () => {
    const dashboard = createSeedDashboard();
    const duplicateWidget = {
      id: dashboard.widgets[0].id,
      type: 'weather',
      layout: { x: 0, y: 3, w: 4, h: 2 },
      configuration: { location: 'Warsaw' },
    };
    storage.setItem(
      'configurable-dashboard.snapshot',
      JSON.stringify({
        schemaVersion: 1,
        dashboard: {
          ...dashboard,
          widgets: [duplicateWidget, ...dashboard.widgets],
        },
      }),
    );

    expect(service.load()).toEqual({
      status: 'recovery',
      message: 'The saved Dashboard is invalid.',
    });
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
