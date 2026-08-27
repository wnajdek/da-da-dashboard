import { Injectable, Signal, inject, signal } from '@angular/core';
import { DemoData, DemoDataService } from './demo-data.service';
import { Dashboard } from './dashboard.models';
import { createSeedDashboard } from './dashboard.seed';

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  readonly #dashboard = signal<Dashboard>(createSeedDashboard());
  readonly #demoDataService = inject(DemoDataService);

  readonly dashboard: Signal<Dashboard> = this.#dashboard.asReadonly();
  readonly demoData: Signal<DemoData> = this.#demoDataService.data;
}
