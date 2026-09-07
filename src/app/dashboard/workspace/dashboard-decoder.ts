import type {
  Dashboard,
  GridLayout,
  WidgetConfigurationChange,
  WidgetCreation,
  WidgetInstance,
  WidgetLayoutChange,
  WidgetType,
} from './dashboard.models';
import { decodeJsonObject, isRecord } from './json-value';

export const DASHBOARD_GRID_COLUMNS = 12;

export interface DashboardSnapshotV1 {
  readonly schemaVersion: 1;
  readonly dashboard: Dashboard;
}

/**
 * A Widget Type is a stable, lowercase identifier. It describes the Widget's
 * kind only; it does not require an installed implementation, so an otherwise
 * valid persisted Widget can remain unavailable.
 */
export function decodeWidgetType(value: unknown): WidgetType | null {
  return typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 128 &&
    /^[a-z0-9][a-z0-9._-]*$/.test(value)
    ? value
    : null;
}

export function decodeGridLayout(value: unknown): GridLayout | null {
  if (
    !isRecord(value) ||
    !isNonNegativeInteger(value['x']) ||
    !isNonNegativeInteger(value['y']) ||
    !isPositiveInteger(value['w']) ||
    !isPositiveInteger(value['h']) ||
    value['w'] > DASHBOARD_GRID_COLUMNS ||
    value['x'] + value['w'] > DASHBOARD_GRID_COLUMNS
  ) {
    return null;
  }

  return { x: value['x'], y: value['y'], w: value['w'], h: value['h'] };
}

export function decodeGridLayoutSize(
  value: unknown,
): Pick<GridLayout, 'w' | 'h'> | null {
  if (
    !isRecord(value) ||
    !isPositiveInteger(value['w']) ||
    !isPositiveInteger(value['h']) ||
    value['w'] > DASHBOARD_GRID_COLUMNS
  ) {
    return null;
  }

  return { w: value['w'], h: value['h'] };
}

export function decodeWidgetInstance(value: unknown): WidgetInstance | null {
  if (!isRecord(value) || !isUuid(value['id'])) {
    return null;
  }

  const type = decodeWidgetType(value['type']);
  const layout = decodeGridLayout(value['layout']);
  const configuration = decodeJsonObject(value['configuration']);

  if (type === null || layout === null || configuration === null) {
    return null;
  }

  return { id: value['id'], type, layout, configuration };
}

export function decodeDashboard(value: unknown): Dashboard | null {
  if (
    !isRecord(value) ||
    !isUuid(value['id']) ||
    !isNonEmptyString(value['title']) ||
    !Array.isArray(value['widgets'])
  ) {
    return null;
  }

  const widgets: WidgetInstance[] = [];
  const widgetIds = new Set<string>();

  for (const widgetValue of value['widgets']) {
    const widget = decodeWidgetInstance(widgetValue);

    if (widget === null || widgetIds.has(widget.id)) {
      return null;
    }

    widgetIds.add(widget.id);
    widgets.push(widget);
  }

  return {
    id: value['id'],
    title: value['title'],
    widgets,
  };
}

export function decodeDashboardSnapshot(
  value: unknown,
): DashboardSnapshotV1 | null {
  if (!isRecord(value) || value['schemaVersion'] !== 1) {
    return null;
  }

  const dashboard = decodeDashboard(value['dashboard']);

  return dashboard === null ? null : { schemaVersion: 1, dashboard };
}

export function decodeWidgetCreation(value: unknown): WidgetCreation | null {
  if (!isRecord(value)) {
    return null;
  }

  const type = decodeWidgetType(value['type']);
  const configuration = decodeJsonObject(value['configuration']);
  const preferredLayout = decodeGridLayoutSize(value['preferredLayout']);

  return type === null || configuration === null || preferredLayout === null
    ? null
    : { type, configuration, preferredLayout };
}

export function decodeWidgetConfigurationChange(
  value: unknown,
): WidgetConfigurationChange | null {
  if (!isRecord(value) || !isUuid(value['id'])) {
    return null;
  }

  const configuration = decodeJsonObject(value['configuration']);

  return configuration === null ? null : { id: value['id'], configuration };
}

export function decodeWidgetLayoutChange(
  value: unknown,
): WidgetLayoutChange | null {
  if (!isRecord(value) || !isUuid(value['id'])) {
    return null;
  }

  const layout = decodeGridLayout(value['layout']);

  return layout === null ? null : { id: value['id'], layout };
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}
