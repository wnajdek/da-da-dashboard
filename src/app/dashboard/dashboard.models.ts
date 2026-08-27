export type WidgetType = 'kpi' | 'time-series' | 'notes';

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
    readonly dataSource: 'monthly-revenue';
    readonly displayFormat: 'currency';
  };
}

export interface TimeSeriesWidgetInstance extends WidgetInstanceBase {
  readonly type: 'time-series';
  readonly configuration: {
    readonly title: string;
    readonly dataSource: 'monthly-revenue-trend';
  };
}

export interface NotesWidgetInstance extends WidgetInstanceBase {
  readonly type: 'notes';
  readonly configuration: {
    readonly title: string;
    readonly body: string;
  };
}

export type WidgetInstance = KpiWidgetInstance | TimeSeriesWidgetInstance | NotesWidgetInstance;

export interface Dashboard {
  readonly id: string;
  readonly title: string;
  readonly widgets: readonly WidgetInstance[];
}
