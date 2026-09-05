import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  DASHBOARD_STORAGE,
  DashboardPersistenceService,
} from './dashboard-persistence.service';
import { DashboardStore } from './dashboard.store';
import { MemoryStorage } from '../testing/memory-storage';

describe('DashboardStore', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: DASHBOARD_STORAGE, useValue: storage },
      ],
    });
  });

  it('seeds an empty Dashboard while no Widget is installed', () => {
    const store = TestBed.inject(DashboardStore);

    expect(store.dashboard()?.widgets).toEqual([]);
    expect(
      JSON.parse(storage.getItem('configurable-dashboard.snapshot')!),
    ).toEqual({ schemaVersion: 1, dashboard: store.dashboard() });
  });

  it('requires an explicit reset before replacing unusable saved data', () => {
    storage.setItem('configurable-dashboard.snapshot', 'invalid');
    const store = TestBed.inject(DashboardStore);

    expect(store.dashboard()).toBeNull();
    expect(store.recoveryMessage()).toBe(
      'The saved Dashboard could not be read.',
    );

    store.resetToDefaults();

    expect(store.dashboard()?.widgets).toEqual([]);
  });

  it('adds an installed Widget with its opaque defaults and preferred Grid Layout', () => {
    const store = TestBed.inject(DashboardStore);

    store.addWidget({
      type: 'weather',
      configuration: { location: 'Warsaw', units: 'metric' },
      preferredLayout: { w: 4, h: 3 },
    });

    const widget = store.dashboard()?.widgets[0];

    expect(widget).toBeDefined();
    expect(typeof widget?.id).toBe('string');
    expect(widget?.type).toBe('weather');
    expect(JSON.stringify(widget?.configuration)).toBe(
      '{"location":"Warsaw","units":"metric"}',
    );
    expect(widget?.layout).toEqual({ x: 0, y: 0, w: 4, h: 3 });
    expect(
      JSON.parse(storage.getItem('configurable-dashboard.snapshot')!),
    ).toEqual({
      schemaVersion: 1,
      dashboard: store.dashboard(),
    });
  });

  it('persists a complete replacement Widget Configuration without interpreting it', () => {
    const store = TestBed.inject(DashboardStore);
    store.addWidget({
      type: 'weather',
      configuration: { location: 'Warsaw', units: 'metric' },
      preferredLayout: { w: 4, h: 3 },
    });
    const widget = store.dashboard()!.widgets[0];

    store.updateWidgetConfiguration({
      id: widget.id,
      configuration: { location: 'Gdańsk', units: 'imperial', forecastDays: 5 },
    });

    expect(JSON.stringify(store.dashboard()!.widgets[0].configuration)).toBe(
      '{"location":"Gdańsk","units":"imperial","forecastDays":5}',
    );
  });

  it('persists a runtime Widget layout through a Dashboard reload', () => {
    const store = TestBed.inject(DashboardStore);

    store.addWidget({
      type: 'weather',
      configuration: { location: 'Warsaw', units: 'metric' },
      preferredLayout: { w: 4, h: 3 },
    });
    const widget = store.dashboard()!.widgets[0];
    const layout = { x: 6, y: 8, w: 5, h: 4 };

    store.commitGridLayoutChange([{ id: widget.id, layout }]);

    const reloadedStore = new DashboardStore(
      TestBed.inject(DashboardPersistenceService),
    );
    const reloadedWidget = reloadedStore.dashboard()!.widgets[0];

    expect(JSON.stringify(reloadedWidget.configuration)).toBe(
      '{"location":"Warsaw","units":"metric"}',
    );
    expect(reloadedWidget.layout).toEqual(layout);
  });

  it('ignores invalid or unknown Grid Layout changes', () => {
    const store = TestBed.inject(DashboardStore);

    store.addWidget({
      type: 'weather',
      configuration: { location: 'Warsaw', units: 'metric' },
      preferredLayout: { w: 4, h: 3 },
    });
    const widget = store.dashboard()!.widgets[0];
    const savedSnapshot = storage.getItem('configurable-dashboard.snapshot');

    store.commitGridLayoutChange([
      {
        id: widget.id,
        layout: { x: -1, y: 0, w: 4, h: 3 },
      },
      {
        id: 'unknown-widget',
        layout: { x: 2, y: 2, w: 2, h: 2 },
      },
    ]);

    expect(store.dashboard()!.widgets[0].layout).toEqual({
      x: 0,
      y: 0,
      w: 4,
      h: 3,
    });
    expect(storage.getItem('configurable-dashboard.snapshot')).toBe(
      savedSnapshot,
    );
  });

  it('retains the removal undo behavior for future installed Widgets', () => {
    jasmine.clock().install();

    try {
      const widget = {
        id: 'f09f1c23-2b6d-4f2d-9ca5-8b7be4a5dd11',
        type: 'example-widget',
        layout: { x: 0, y: 0, w: 3, h: 2 },
        configuration: { title: 'Example' },
      };
      storage.setItem(
        'configurable-dashboard.snapshot',
        JSON.stringify({
          schemaVersion: 1,
          dashboard: {
            id: 'e25b6b77-2b4e-4d7e-91df-51feded26e83',
            title: 'Saved dashboard',
            widgets: [widget],
          },
        }),
      );
      const store = TestBed.inject(DashboardStore);

      store.removeWidget(widget.id);
      expect(store.dashboard()?.widgets).toEqual([]);
      expect(store.canUndoRemoval()).toBeTrue();

      store.undoWidgetRemoval();
      expect(store.dashboard()?.widgets).toEqual([widget]);

      store.removeWidget(widget.id);
      jasmine.clock().tick(5_000);
      expect(store.canUndoRemoval()).toBeFalse();
    } finally {
      jasmine.clock().uninstall();
    }
  });
});
