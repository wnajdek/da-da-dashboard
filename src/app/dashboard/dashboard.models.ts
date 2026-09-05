import { isRecord, type JsonObject } from './json-value';

export type { JsonObject, JsonValue } from './json-value';

export type WidgetType = string & {};

export type WidgetConfiguration = JsonObject;

export interface GridLayout {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export function isValidGridLayout(value: unknown): value is GridLayout {
  return (
    isRecord(value) &&
    isNonNegativeFiniteNumber(value['x']) &&
    isNonNegativeFiniteNumber(value['y']) &&
    isPositiveFiniteNumber(value['w']) &&
    isPositiveFiniteNumber(value['h'])
  );
}

export function isValidGridLayoutSize(
  value: unknown,
): value is Pick<GridLayout, 'w' | 'h'> {
  return (
    isRecord(value) &&
    isPositiveFiniteNumber(value['w']) &&
    isPositiveFiniteNumber(value['h'])
  );
}

export interface WidgetLayoutChange {
  readonly id: string;
  readonly layout: GridLayout;
}

export interface WidgetConfigurationChange {
  readonly id: string;
  readonly configuration: WidgetConfiguration;
}

export interface WidgetCreation {
  readonly type: WidgetType;
  readonly configuration: WidgetConfiguration;
  readonly preferredLayout: Pick<GridLayout, 'w' | 'h'>;
}

export interface WidgetInstance {
  readonly id: string;
  readonly type: WidgetType;
  readonly layout: GridLayout;
  readonly configuration: WidgetConfiguration;
}

export interface Dashboard {
  readonly id: string;
  readonly title: string;
  readonly widgets: readonly WidgetInstance[];
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
