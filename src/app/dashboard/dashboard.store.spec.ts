import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { DASHBOARD_STORAGE } from './dashboard-persistence.service';
import { DashboardStore } from './dashboard.store';
import { MemoryStorage } from '../testing/memory-storage';

describe('DashboardStore', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    TestBed.configureTestingModule({
      providers: [{ provide: DASHBOARD_STORAGE, useValue: storage }],
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

  it('retains the removal undo behavior for future installed Widgets', fakeAsync(() => {
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
    tick(5_000);
    expect(store.canUndoRemoval()).toBeFalse();
  }));
});
