import { TestBed } from '@angular/core/testing';
import { DASHBOARD_STORAGE } from './dashboard-persistence.service';
import { createSeedDashboard } from './dashboard.seed';
import { DashboardStore } from './dashboard.store';
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
