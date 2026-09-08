import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  DASHBOARD_STORAGE,
  DashboardPersistenceService,
} from './dashboard-persistence.service';
import { DashboardStore, WIDGET_INSTANCE_ID_FACTORY } from './dashboard.store';
import { MemoryStorage } from '../../testing/memory-storage';

describe('DashboardStore', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: DASHBOARD_STORAGE, useValue: storage },
        {
          provide: WIDGET_INSTANCE_ID_FACTORY,
          useValue: () => 'f09f1c23-2b6d-4f2d-9ca5-8b7be4a5dd11',
        },
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

    expect(store.resetToDefaults()).toEqual({ status: 'success' });

    expect(store.dashboard()?.widgets).toEqual([]);
  });

  it('adds an installed Widget with its opaque defaults and preferred Grid Layout', () => {
    const store = TestBed.inject(DashboardStore);

    const result = store.addWidget({
      type: 'weather',
      configuration: { location: 'Warsaw', units: 'metric' },
      preferredLayout: { w: 4, h: 3 },
    });

    const widget = store.dashboard()?.widgets[0];

    expect(result).toEqual({ status: 'success' });
    expect(widget).toBeDefined();
    expect(widget?.id).toBe('f09f1c23-2b6d-4f2d-9ca5-8b7be4a5dd11');
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

  it('ignores a Widget creation with an invalid Widget Type', () => {
    const store = TestBed.inject(DashboardStore);

    const result = store.addWidget({
      type: 'Weather',
      configuration: { location: 'Warsaw' },
      preferredLayout: { w: 4, h: 3 },
    });

    expect(result).toEqual({ status: 'invalid-input' });
    expect(store.dashboard()?.widgets).toEqual([]);
  });

  it('reports missing Widgets without attempting persistence', () => {
    const store = TestBed.inject(DashboardStore);
    const save = spyOn(
      TestBed.inject(DashboardPersistenceService),
      'save',
    ).and.callThrough();

    const result = store.updateWidgetConfiguration({
      id: 'f09f1c23-2b6d-4f2d-9ca5-8b7be4a5dd11',
      configuration: { location: 'Warsaw' },
    });

    expect(result).toEqual({ status: 'missing-target' });
    expect(save).not.toHaveBeenCalled();
  });

  it('reports malformed Widget Instance IDs as invalid input', () => {
    const store = TestBed.inject(DashboardStore);

    expect(store.removeWidget('not-a-widget-id')).toEqual({
      status: 'invalid-input',
    });
  });

  it('reports storage failures, keeps the persisted Dashboard, and publishes feedback', () => {
    const store = TestBed.inject(DashboardStore);
    const savedSnapshot = storage.getItem('configurable-dashboard.snapshot');
    spyOn(storage, 'setItem').and.throwError('Storage quota exceeded');

    const result = store.addWidget({
      type: 'weather',
      configuration: { location: 'Warsaw' },
      preferredLayout: { w: 4, h: 3 },
    });

    expect(result).toEqual({ status: 'storage-failure' });
    expect(store.dashboard()?.widgets).toEqual([]);
    expect(storage.getItem('configurable-dashboard.snapshot')).toBe(
      savedSnapshot,
    );
    expect(store.persistenceFailureMessage()).toBe(
      'The requested Dashboard change could not be saved locally.',
    );
  });

  it('does not replace the current Dashboard when reset persistence fails', () => {
    const store = TestBed.inject(DashboardStore);
    store.addWidget({
      type: 'weather',
      configuration: { location: 'Warsaw' },
      preferredLayout: { w: 4, h: 3 },
    });
    const persistedDashboard = store.dashboard();
    spyOn(storage, 'setItem').and.throwError('Storage quota exceeded');

    expect(store.resetToDefaults()).toEqual({ status: 'storage-failure' });
    expect(store.dashboard()).toEqual(persistedDashboard);
    expect(store.recoveryMessage()).toBeNull();
  });

  it('persists a complete replacement Widget Configuration without interpreting it', () => {
    const store = TestBed.inject(DashboardStore);
    store.addWidget({
      type: 'weather',
      configuration: { location: 'Warsaw', units: 'metric' },
      preferredLayout: { w: 4, h: 3 },
    });
    const widget = store.dashboard()!.widgets[0];

    expect(
      store.updateWidgetConfiguration({
        id: widget.id,
        configuration: {
          location: 'Gdańsk',
          units: 'imperial',
          forecastDays: 5,
        },
      }),
    ).toEqual({ status: 'success' });

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

    expect(store.commitGridLayoutChange([{ id: widget.id, layout }])).toEqual({
      status: 'success',
    });

    const reloadedStore = TestBed.runInInjectionContext(
      () => new DashboardStore(),
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

    expect(
      store.commitGridLayoutChange([
        {
          id: widget.id,
          layout: { x: -1, y: 0, w: 4, h: 3 },
        },
        {
          id: 'unknown-widget',
          layout: { x: 2, y: 2, w: 2, h: 2 },
        },
      ]),
    ).toEqual({ status: 'invalid-input' });

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

      expect(store.removeWidget(widget.id)).toEqual({ status: 'success' });
      expect(store.dashboard()?.widgets).toEqual([]);
      expect(store.canUndoRemoval()).toBeTrue();

      expect(store.undoWidgetRemoval()).toEqual({ status: 'success' });
      expect(store.dashboard()?.widgets).toEqual([widget]);

      expect(store.removeWidget(widget.id)).toEqual({ status: 'success' });
      jasmine.clock().tick(5_000);
      expect(store.canUndoRemoval()).toBeFalse();
    } finally {
      jasmine.clock().uninstall();
    }
  });
});
