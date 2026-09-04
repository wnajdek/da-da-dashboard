import type { JsonObject } from './json-value';

export type { JsonObject, JsonValue } from './json-value';

export type WidgetType = string & {};

export type WidgetConfiguration = JsonObject;

export interface GridLayout {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
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
