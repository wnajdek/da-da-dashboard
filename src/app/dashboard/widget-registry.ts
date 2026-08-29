import { Type } from '@angular/core';
import { KpiWidgetComponent } from './kpi-widget.component';
import { NotesWidgetComponent } from './notes-widget.component';
import { TimeSeriesWidgetComponent } from './time-series-widget.component';
import { WidgetType } from './dashboard.models';

export const BUILT_IN_WIDGET_REGISTRY = {
  kpi: KpiWidgetComponent,
  'time-series': TimeSeriesWidgetComponent,
  notes: NotesWidgetComponent,
} satisfies Record<WidgetType, Type<unknown>>;
