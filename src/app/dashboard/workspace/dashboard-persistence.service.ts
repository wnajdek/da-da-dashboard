import { inject, Injectable, InjectionToken } from '@angular/core';
import {
  decodeDashboard,
  decodeDashboardSnapshot,
  type DashboardSnapshotV1,
} from './dashboard-decoder';
import type { Dashboard } from './dashboard.models';
import { isRecord } from './json-value';

export type { DashboardSnapshotV1 } from './dashboard-decoder';

export const DASHBOARD_STORAGE_KEY = 'configurable-dashboard.snapshot';
export const DASHBOARD_STORAGE = new InjectionToken<Storage>(
  'Dashboard storage',
  { providedIn: 'root', factory: () => localStorage },
);

export type DashboardLoadResult =
  | { readonly status: 'missing' }
  | { readonly status: 'ready'; readonly dashboard: Dashboard }
  | { readonly status: 'recovery'; readonly message: string };

@Injectable({ providedIn: 'root' })
export class DashboardPersistenceService {
  private readonly storage = inject(DASHBOARD_STORAGE);

  load(): DashboardLoadResult {
    let savedSnapshot: string | null;

    try {
      savedSnapshot = this.storage.getItem(DASHBOARD_STORAGE_KEY);
    } catch {
      return {
        status: 'recovery',
        message: 'The saved Dashboard could not be read.',
      };
    }

    if (savedSnapshot === null) {
      return { status: 'missing' };
    }

    try {
      const snapshot: unknown = JSON.parse(savedSnapshot);

      if (isRecord(snapshot) && snapshot['schemaVersion'] !== 1) {
        return {
          status: 'recovery',
          message: 'The saved Dashboard uses an unsupported version.',
        };
      }

      const decodedSnapshot = decodeDashboardSnapshot(snapshot);

      if (decodedSnapshot === null) {
        return {
          status: 'recovery',
          message: 'The saved Dashboard is invalid.',
        };
      }

      return { status: 'ready', dashboard: decodedSnapshot.dashboard };
    } catch {
      return {
        status: 'recovery',
        message: 'The saved Dashboard could not be read.',
      };
    }
  }

  save(dashboard: Dashboard): boolean {
    const decodedDashboard = decodeDashboard(dashboard);

    if (decodedDashboard === null) {
      return false;
    }

    const snapshot: DashboardSnapshotV1 = {
      schemaVersion: 1,
      dashboard: decodedDashboard,
    };

    try {
      this.storage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(snapshot));
      return true;
    } catch {
      return false;
    }
  }
}
