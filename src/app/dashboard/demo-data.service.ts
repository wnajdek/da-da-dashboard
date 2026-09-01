import { computed, Injectable, Signal, signal } from '@angular/core';
import { KpiDataSourceKey, TimeSeriesDataSourceKey } from './dashboard.models';
import { WidgetDataGateway } from './widget-data-gateway';

export interface DemoData {
  readonly 'monthly-revenue': number;
  readonly 'monthly-revenue-trend': readonly number[];
}

@Injectable({ providedIn: 'root' })
export class DemoDataService extends WidgetDataGateway {
  readonly #data = signal<DemoData>({
    'monthly-revenue': 124500,
    'monthly-revenue-trend': [94000, 101000, 109000, 117000],
  });

  readonly #kpiValues: Record<KpiDataSourceKey, Signal<number>> = {
    'monthly-revenue': computed(() => this.#data()['monthly-revenue']),
  };
  readonly #timeSeriesValues: Record<
    TimeSeriesDataSourceKey,
    Signal<readonly number[]>
  > = {
    'monthly-revenue-trend': computed(
      () => this.#data()['monthly-revenue-trend'],
    ),
  };

  override kpiValueFor(source: KpiDataSourceKey): Signal<number> {
    return this.#kpiValues[source];
  }

  override timeSeriesValuesFor(
    source: TimeSeriesDataSourceKey,
  ): Signal<readonly number[]> {
    return this.#timeSeriesValues[source];
  }

  refresh(): void {
    this.#data.update((data) => ({
      'monthly-revenue': data['monthly-revenue'] + 2500,
      'monthly-revenue-trend': data['monthly-revenue-trend'].map(
        (value) => value + 2000,
      ),
    }));
  }
}
