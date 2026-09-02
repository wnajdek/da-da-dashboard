import { inject, Injectable, InjectionToken } from '@angular/core';
import { Dashboard, WidgetInstance } from './dashboard.models';

export const DASHBOARD_STORAGE_KEY = 'configurable-dashboard.snapshot';
export const DASHBOARD_STORAGE = new InjectionToken<Storage>(
  'Dashboard storage',
  { providedIn: 'root', factory: () => localStorage },
);

export interface DashboardSnapshotV1 {
  readonly schemaVersion: 1;
  readonly dashboard: Dashboard;
}

export type DashboardLoadResult =
  | { readonly status: 'missing' }
  | { readonly status: 'ready'; readonly dashboard: Dashboard }
  | { readonly status: 'recovery'; readonly message: string };

@Injectable({ providedIn: 'root' })
export class DashboardPersistenceService {
  readonly #storage = inject(DASHBOARD_STORAGE);

  load(): DashboardLoadResult {
    let savedSnapshot: string | null;

    try {
      savedSnapshot = this.#storage.getItem(DASHBOARD_STORAGE_KEY);
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

      if (!isRecord(snapshot) || snapshot['schemaVersion'] !== 1) {
        return {
          status: 'recovery',
          message: 'The saved Dashboard uses an unsupported version.',
        };
      }

      if (!isDashboard(snapshot['dashboard'])) {
        return {
          status: 'recovery',
          message: 'The saved Dashboard is invalid.',
        };
      }

      return { status: 'ready', dashboard: snapshot['dashboard'] };
    } catch {
      return {
        status: 'recovery',
        message: 'The saved Dashboard could not be read.',
      };
    }
  }

  save(dashboard: Dashboard): boolean {
    const snapshot: DashboardSnapshotV1 = { schemaVersion: 1, dashboard };

    try {
      this.#storage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(snapshot));
      return true;
    } catch {
      return false;
    }
  }
}

function isDashboard(value: unknown): value is Dashboard {
  return (
    isRecord(value) &&
    isUuid(value['id']) &&
    typeof value['title'] === 'string' &&
    Array.isArray(value['widgets']) &&
    value['widgets'].every(isWidgetInstance) &&
    new Set(value['widgets'].map((widget) => widget.id)).size ===
      value['widgets'].length
  );
}

function isWidgetInstance(value: unknown): value is WidgetInstance {
  if (
    !isRecord(value) ||
    !isUuid(value['id']) ||
    !isGridLayout(value['layout']) ||
    !isRecord(value['configuration'])
  ) {
    return false;
  }

  return (
    typeof value['type'] === 'string' &&
    value['type'].length > 0 &&
    isJsonValue(value['configuration'])
  );
}

function isGridLayout(value: unknown): boolean {
  return (
    isRecord(value) &&
    isNonNegativeFiniteNumber(value['x']) &&
    isNonNegativeFiniteNumber(value['y']) &&
    isPositiveFiniteNumber(value['w']) &&
    isPositiveFiniteNumber(value['h'])
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isJsonValue(value: unknown): boolean {
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'string'
  ) {
    return true;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  return isRecord(value) && Object.values(value).every(isJsonValue);
}

function isUuid(value: unknown): boolean {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function isNonNegativeFiniteNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isPositiveFiniteNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
