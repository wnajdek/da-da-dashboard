import { Injectable, Signal, signal } from '@angular/core';

export interface DemoData {
  readonly monthlyRevenue: number;
  readonly monthlyRevenueTrend: readonly number[];
}

@Injectable({ providedIn: 'root' })
export class DemoDataService {
  readonly #data = signal<DemoData>({
    monthlyRevenue: 124500,
    monthlyRevenueTrend: [94000, 101000, 109000, 117000]
  });

  readonly data: Signal<DemoData> = this.#data.asReadonly();
}
