import { Type } from '@angular/core';
import { KpiWidgetComponent } from './kpi-widget.component';
import { NotesWidgetComponent } from './notes-widget.component';
import { TimeSeriesWidgetComponent } from './time-series-widget.component';
import { GridLayout, WidgetInstance, WidgetType } from './dashboard.models';

export type WidgetDefinition = {
  readonly [T in WidgetType]: {
    readonly type: T;
    readonly displayName: string;
    readonly defaultConfiguration: Extract<
      WidgetInstance,
      { type: T }
    >['configuration'];
    readonly preferredLayout: Pick<GridLayout, 'w' | 'h'>;
    readonly component: Type<unknown>;
  };
}[WidgetType];

const definitions = Object.freeze({
  kpi: Object.freeze({
    type: 'kpi',
    displayName: 'KPI',
    defaultConfiguration: Object.freeze({
      title: 'Monthly revenue',
      dataSource: 'monthly-revenue',
      displayFormat: 'currency',
    }),
    preferredLayout: Object.freeze({ w: 3, h: 2 }),
    component: KpiWidgetComponent,
  }),
  'time-series': Object.freeze({
    type: 'time-series',
    displayName: 'Time series',
    defaultConfiguration: Object.freeze({
      title: 'Revenue trend',
      dataSource: 'monthly-revenue-trend',
    }),
    preferredLayout: Object.freeze({ w: 3, h: 2 }),
    component: TimeSeriesWidgetComponent,
  }),
  notes: Object.freeze({
    type: 'notes',
    displayName: 'Notes',
    defaultConfiguration: Object.freeze({
      title: 'New note',
      body: 'Add your notes here.',
    }),
    preferredLayout: Object.freeze({ w: 3, h: 2 }),
    component: NotesWidgetComponent,
  }),
} satisfies Record<WidgetType, WidgetDefinition>);

export const BUILT_IN_WIDGET_REGISTRY = definitions;
export const BUILT_IN_WIDGET_TYPES = Object.freeze(
  Object.values(BUILT_IN_WIDGET_REGISTRY),
);
