export type WidgetType = string & {};

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export type WidgetConfiguration = { readonly [key: string]: JsonValue };

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
