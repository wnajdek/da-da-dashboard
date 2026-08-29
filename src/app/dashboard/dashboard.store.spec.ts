import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { DASHBOARD_STORAGE } from './dashboard-persistence.service';
import { createSeedDashboard } from './dashboard.seed';
import { DashboardStore } from './dashboard.store';
import { DemoDataService } from './demo-data.service';
import { MemoryStorage } from '../testing/memory-storage';

class WriteFailingStorage extends MemoryStorage {
  override setItem(): void {
    throw new Error('Storage quota exceeded');
  }
}

describe('DashboardStore', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    TestBed.configureTestingModule({
      providers: [{ provide: DASHBOARD_STORAGE, useValue: storage }],
    });
  });

  it('seeds and persists the Dashboard when no snapshot exists', () => {
    const store = TestBed.inject(DashboardStore);

    expect(store.dashboard()?.title).toBe('My dashboard');
    expect(
      JSON.parse(storage.getItem('configurable-dashboard.snapshot')!),
    ).toEqual({
      schemaVersion: 1,
      dashboard: store.dashboard(),
    });
  });

  it('restores a valid saved Dashboard', () => {
    const dashboard = { ...createSeedDashboard(), title: 'Saved dashboard' };
    storage.setItem(
      'configurable-dashboard.snapshot',
      JSON.stringify({ schemaVersion: 1, dashboard }),
    );

    const store = TestBed.inject(DashboardStore);

    expect(store.dashboard()).toEqual(dashboard);
  });

  it('adds each supported Widget Type with defaults below the existing layout', () => {
    const store = TestBed.inject(DashboardStore);

    store.addWidget('kpi');
    store.addWidget('time-series');
    store.addWidget('notes');

    const addedWidgets = store.dashboard()!.widgets.slice(3);
    expect(addedWidgets).toEqual([
      jasmine.objectContaining({
        id: jasmine.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        ),
        type: 'kpi',
        layout: { x: 0, y: 3, w: 3, h: 2 },
        configuration: {
          title: 'Monthly revenue',
          dataSource: 'monthly-revenue',
          displayFormat: 'currency',
        },
      }),
      jasmine.objectContaining({
        id: jasmine.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        ),
        type: 'time-series',
        layout: { x: 0, y: 5, w: 3, h: 2 },
        configuration: {
          title: 'Revenue trend',
          dataSource: 'monthly-revenue-trend',
        },
      }),
      jasmine.objectContaining({
        id: jasmine.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        ),
        type: 'notes',
        layout: { x: 0, y: 7, w: 3, h: 2 },
        configuration: {
          title: 'New note',
          body: 'Add your notes here.',
        },
      }),
    ]);
  });

  it('removes a Widget Instance and restores its exact place with undo', () => {
    const store = TestBed.inject(DashboardStore);
    const removedWidget = store.dashboard()!.widgets[1];

    store.removeWidget(removedWidget.id);

    expect(store.dashboard()!.widgets).not.toContain(removedWidget);
    expect(store.canUndoRemoval()).toBeTrue();
    expect(
      JSON.parse(storage.getItem('configurable-dashboard.snapshot')!).dashboard
        .widgets,
    ).not.toContain(removedWidget);

    store.undoWidgetRemoval();

    expect(store.dashboard()!.widgets[1]).toEqual(removedWidget);
    expect(store.canUndoRemoval()).toBeFalse();
    expect(
      JSON.parse(storage.getItem('configurable-dashboard.snapshot')!).dashboard
        .widgets[1],
    ).toEqual(removedWidget);
  });

  it('expires a pending Widget removal without restoring it', fakeAsync(() => {
    const store = TestBed.inject(DashboardStore);
    const removedWidget = store.dashboard()!.widgets[0];

    store.removeWidget(removedWidget.id);
    tick(5_000);

    expect(store.canUndoRemoval()).toBeFalse();
    store.undoWidgetRemoval();
    expect(store.dashboard()!.widgets).not.toContain(removedWidget);
  }));

  it('refreshes resolved Demo Data without changing the persisted Dashboard', () => {
    const store = TestBed.inject(DashboardStore);
    const demoData = TestBed.inject(DemoDataService);
    const savedDashboard = storage.getItem('configurable-dashboard.snapshot');

    store.refreshDemoData();

    expect(demoData.kpiValueFor('monthly-revenue')).toBe(127000);
    expect(storage.getItem('configurable-dashboard.snapshot')).toBe(
      savedDashboard,
    );
  });

  it('requires an explicit reset before replacing unusable saved data', () => {
    storage.setItem('configurable-dashboard.snapshot', 'invalid');
    const store = TestBed.inject(DashboardStore);

    expect(store.dashboard()).toBeNull();
    expect(store.recoveryMessage()).toBe(
      'The saved Dashboard could not be read.',
    );
    expect(storage.getItem('configurable-dashboard.snapshot')).toBe('invalid');

    store.resetToDefaults();

    expect(store.recoveryMessage()).toBeNull();
    expect(store.dashboard()?.title).toBe('My dashboard');
    expect(
      JSON.parse(storage.getItem('configurable-dashboard.snapshot')!),
    ).toEqual({
      schemaVersion: 1,
      dashboard: store.dashboard(),
    });
  });

  it('reports when a Dashboard cannot be saved locally', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: DASHBOARD_STORAGE, useValue: new WriteFailingStorage() },
      ],
    });

    const store = TestBed.inject(DashboardStore);

    expect(store.dashboard()).toBeNull();
    expect(store.recoveryMessage()).toBe(
      'The Dashboard could not be saved locally.',
    );
  });
});
