import { InjectionToken } from '@angular/core';
import type { Type } from '@angular/core';
import type {
  BuiltInWidgetType,
  GridLayout,
  WidgetInstance,
} from './dashboard.models';

export type WidgetImplementationLoader = () => Promise<Type<unknown>>;

export type WidgetDefinition = {
  readonly [T in BuiltInWidgetType]: {
    readonly type: T;
    readonly displayName: string;
    readonly defaultConfiguration: Extract<
      WidgetInstance,
      { type: T }
    >['configuration'];
    readonly preferredLayout: Pick<GridLayout, 'w' | 'h'>;
    readonly loadImplementation: WidgetImplementationLoader;
  };
}[BuiltInWidgetType];

export type WidgetRegistry = Readonly<{
  readonly [T in BuiltInWidgetType]: Extract<WidgetDefinition, { type: T }>;
}>;

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
    loadImplementation: () =>
      import('./kpi-widget.component').then(
        ({ KpiWidgetComponent }) => KpiWidgetComponent,
      ),
  }),
  'time-series': Object.freeze({
    type: 'time-series',
    displayName: 'Time series',
    defaultConfiguration: Object.freeze({
      title: 'Revenue trend',
      dataSource: 'monthly-revenue-trend',
    }),
    preferredLayout: Object.freeze({ w: 3, h: 2 }),
    loadImplementation: () =>
      import('./time-series-widget.component').then(
        ({ TimeSeriesWidgetComponent }) => TimeSeriesWidgetComponent,
      ),
  }),
  notes: Object.freeze({
    type: 'notes',
    displayName: 'Notes',
    defaultConfiguration: Object.freeze({
      title: 'New note',
      body: 'Add your notes here.',
    }),
    preferredLayout: Object.freeze({ w: 3, h: 2 }),
    loadImplementation: () =>
      import('./notes-widget.component').then(
        ({ NotesWidgetComponent }) => NotesWidgetComponent,
      ),
  }),
} satisfies WidgetRegistry);

export const BUILT_IN_WIDGET_REGISTRY: WidgetRegistry = definitions;
export const WIDGET_REGISTRY = new InjectionToken<WidgetRegistry>(
  'Widget registry',
  { providedIn: 'root', factory: () => BUILT_IN_WIDGET_REGISTRY },
);
export const BUILT_IN_WIDGET_TYPES = Object.freeze(
  Object.values(BUILT_IN_WIDGET_REGISTRY),
);
