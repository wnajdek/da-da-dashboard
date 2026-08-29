export type WidgetType = 'kpi' | 'time-series' | 'notes';
export type KpiDataSourceKey = 'monthly-revenue';
export type TimeSeriesDataSourceKey = 'monthly-revenue-trend';

export interface GridLayout {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

interface WidgetInstanceBase {
  readonly id: string;
  readonly type: WidgetType;
  readonly layout: GridLayout;
}

export interface KpiWidgetInstance extends WidgetInstanceBase {
  readonly type: 'kpi';
  readonly configuration: {
    readonly title: string;
    readonly dataSource: KpiDataSourceKey;
    readonly displayFormat: 'currency';
  };
}

export interface TimeSeriesWidgetInstance extends WidgetInstanceBase {
  readonly type: 'time-series';
  readonly configuration: {
    readonly title: string;
    readonly dataSource: TimeSeriesDataSourceKey;
  };
}

export interface NotesWidgetInstance extends WidgetInstanceBase {
  readonly type: 'notes';
  readonly configuration: {
    readonly title: string;
    readonly body: string;
  };
}

export type WidgetInstance =
  KpiWidgetInstance | TimeSeriesWidgetInstance | NotesWidgetInstance;

export type WidgetConfigurationUpdate =
  | {
      readonly type: 'kpi';
      readonly configuration: KpiWidgetInstance['configuration'];
    }
  | {
      readonly type: 'time-series';
      readonly configuration: TimeSeriesWidgetInstance['configuration'];
    }
  | {
      readonly type: 'notes';
      readonly configuration: NotesWidgetInstance['configuration'];
    };

export interface Dashboard {
  readonly id: string;
  readonly title: string;
  readonly widgets: readonly WidgetInstance[];
}

export interface WidgetContext<T extends WidgetInstance = WidgetInstance> {
  readonly widget: T;
}
