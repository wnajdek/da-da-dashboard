import { Injectable, Signal, signal } from '@angular/core';
import { KpiDataSourceKey, TimeSeriesDataSourceKey } from './dashboard.models';

export interface DemoData {
  readonly 'monthly-revenue': number;
  readonly 'monthly-revenue-trend': readonly number[];
}

@Injectable({ providedIn: 'root' })
export class DemoDataService {
  readonly #data = signal<DemoData>({
    'monthly-revenue': 124500,
    'monthly-revenue-trend': [94000, 101000, 109000, 117000]
  });

  readonly data: Signal<DemoData> = this.#data.asReadonly();

  kpiValueFor(source: KpiDataSourceKey): number {
    return this.data()[source];
  }

  timeSeriesValuesFor(source: TimeSeriesDataSourceKey): readonly number[] {
    return this.data()[source];
  }
}
