import { Signal } from '@angular/core';
import { KpiDataSourceKey, TimeSeriesDataSourceKey } from './dashboard.models';

export abstract class WidgetDataGateway {
  abstract kpiValueFor(source: KpiDataSourceKey): Signal<number>;

  abstract timeSeriesValuesFor(
    source: TimeSeriesDataSourceKey,
  ): Signal<readonly number[]>;
}
