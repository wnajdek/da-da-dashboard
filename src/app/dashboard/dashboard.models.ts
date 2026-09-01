export type WidgetType = 'kpi' | 'time-series' | 'notes';
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

export type WidgetConfiguration =
  | KpiWidgetConfiguration
  | TimeSeriesWidgetConfiguration
  | NotesWidgetConfiguration;

interface WidgetInstanceBase {
  readonly id: string;
  readonly type: WidgetType;
  readonly layout: GridLayout;
}

export interface KpiWidgetInstance extends WidgetInstanceBase {
  readonly type: 'kpi';
  readonly configuration: KpiWidgetConfiguration;
}

export interface TimeSeriesWidgetInstance extends WidgetInstanceBase {
  readonly type: 'time-series';
  readonly configuration: TimeSeriesWidgetConfiguration;
}

export interface NotesWidgetInstance extends WidgetInstanceBase {
  readonly type: 'notes';
  readonly configuration: NotesWidgetConfiguration;
}

export type WidgetInstance =
  KpiWidgetInstance | TimeSeriesWidgetInstance | NotesWidgetInstance;

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
