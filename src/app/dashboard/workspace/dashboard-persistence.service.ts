import { inject, Injectable, InjectionToken } from '@angular/core';
import {
  isValidGridLayout,
  type Dashboard,
  type WidgetInstance,
} from './dashboard.models';
import { decodeJsonObject, isRecord } from './json-value';

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

      if (!isRecord(snapshot) || snapshot['schemaVersion'] !== 1) {
        return {
          status: 'recovery',
          message: 'The saved Dashboard uses an unsupported version.',
        };
      }

      const dashboard = decodeDashboard(snapshot['dashboard']);

      if (dashboard === null) {
        return {
          status: 'recovery',
          message: 'The saved Dashboard is invalid.',
        };
      }

      return { status: 'ready', dashboard };
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

function decodeDashboard(value: unknown): Dashboard | null {
  if (
    !isRecord(value) ||
    !isUuid(value['id']) ||
    typeof value['title'] !== 'string' ||
    !Array.isArray(value['widgets'])
  ) {
    return null;
  }

  const id = value['id'];
  const title = value['title'];
  const widgets = value['widgets'].map(decodeWidgetInstance);
  const decodedWidgets = widgets.filter(
    (widget): widget is WidgetInstance => widget !== null,
  );

  if (
    decodedWidgets.length !== widgets.length ||
    new Set(decodedWidgets.map((widget) => widget.id)).size !== widgets.length
  ) {
    return null;
  }

  return {
    id,
    title,
    widgets: decodedWidgets,
  };
}

function decodeWidgetInstance(value: unknown): WidgetInstance | null {
  if (
    !isRecord(value) ||
    !isUuid(value['id']) ||
    !isValidGridLayout(value['layout'])
  ) {
    return null;
  }

  const configuration = decodeJsonObject(value['configuration']);
  const id = value['id'];
  const type = value['type'];

  if (
    typeof type !== 'string' ||
    type.length === 0 ||
    configuration === null
  ) {
    return null;
  }

  return {
    id,
    type,
    layout: {
      x: value['layout'].x,
      y: value['layout'].y,
      w: value['layout'].w,
      h: value['layout'].h,
    },
    configuration,
  };
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}
