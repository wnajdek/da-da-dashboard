import { Injectable, Signal, signal } from '@angular/core';
import { Dashboard } from './dashboard.models';
import { createSeedDashboard } from './dashboard.seed';

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  readonly #dashboard = signal<Dashboard>(createSeedDashboard());

  readonly dashboard: Signal<Dashboard> = this.#dashboard.asReadonly();
}
