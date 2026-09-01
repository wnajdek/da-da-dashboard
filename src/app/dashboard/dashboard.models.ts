export type BuiltInWidgetType = 'kpi' | 'time-series' | 'notes';
export type UnavailableWidgetType = string & {};
export type WidgetType = BuiltInWidgetType | UnavailableWidgetType;
export type KpiDataSourceKey = 'monthly-revenue';
export type TimeSeriesDataSourceKey = 'monthly-revenue-trend';

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

export interface KpiWidgetConfiguration {
  readonly title: string;
  readonly dataSource: KpiDataSourceKey;
  readonly displayFormat: 'currency';
}

export interface TimeSeriesWidgetConfiguration {
  readonly title: string;
  readonly dataSource: TimeSeriesDataSourceKey;
}

export interface NotesWidgetConfiguration {
  readonly title: string;
  readonly body: string;
}

export interface UnavailableWidgetConfiguration {
  readonly [key: string]: unknown;
}

export type WidgetConfiguration =
  | KpiWidgetConfiguration
  | TimeSeriesWidgetConfiguration
  | NotesWidgetConfiguration;

interface WidgetInstanceBase<T extends WidgetType> {
  readonly id: string;
  readonly type: T;
  readonly layout: GridLayout;
}

export interface KpiWidgetInstance extends WidgetInstanceBase<'kpi'> {
  readonly type: 'kpi';
  readonly configuration: KpiWidgetConfiguration;
}

export interface TimeSeriesWidgetInstance extends WidgetInstanceBase<'time-series'> {
  readonly type: 'time-series';
  readonly configuration: TimeSeriesWidgetConfiguration;
}

export interface NotesWidgetInstance extends WidgetInstanceBase<'notes'> {
  readonly type: 'notes';
  readonly configuration: NotesWidgetConfiguration;
}

export type WidgetInstance =
  | KpiWidgetInstance
  | TimeSeriesWidgetInstance
  | NotesWidgetInstance
  | UnavailableWidgetInstance;

export type KnownWidgetInstance =
  KpiWidgetInstance | TimeSeriesWidgetInstance | NotesWidgetInstance;

export interface UnavailableWidgetInstance extends WidgetInstanceBase<UnavailableWidgetType> {
  readonly type: UnavailableWidgetType;
  readonly configuration: UnavailableWidgetConfiguration;
}

export function isBuiltInWidgetType(
  type: WidgetType,
): type is BuiltInWidgetType {
  return type === 'kpi' || type === 'time-series' || type === 'notes';
}

export function isKnownWidgetInstance(
  widget: WidgetInstance,
): widget is KnownWidgetInstance {
  return isBuiltInWidgetType(widget.type);
}

export type WidgetConfigurationUpdate =
  | {
      readonly type: 'kpi';
      readonly configuration: KpiWidgetConfiguration;
    }
  | {
      readonly type: 'time-series';
      readonly configuration: TimeSeriesWidgetConfiguration;
    }
  | {
      readonly type: 'notes';
      readonly configuration: NotesWidgetConfiguration;
    };

export interface Dashboard {
  readonly id: string;
  readonly title: string;
  readonly widgets: readonly WidgetInstance[];
}
