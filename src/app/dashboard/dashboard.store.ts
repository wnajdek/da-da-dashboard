import { Injectable, Signal, signal } from '@angular/core';
import { Dashboard } from './dashboard.models';
import { DashboardPersistenceService } from './dashboard-persistence.service';
import { createSeedDashboard } from './dashboard.seed';

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  readonly #dashboard = signal<Dashboard | null>(null);
  readonly #recoveryMessage = signal<string | null>(null);

  readonly dashboard: Signal<Dashboard | null> = this.#dashboard.asReadonly();
  readonly recoveryMessage: Signal<string | null> =
    this.#recoveryMessage.asReadonly();

  constructor(private readonly persistence: DashboardPersistenceService) {
    const result = this.persistence.load();

    if (result.status === 'ready') {
      this.#dashboard.set(result.dashboard);
      return;
    }

    if (result.status === 'recovery') {
      this.#recoveryMessage.set(result.message);
      return;
    }

    this.#loadSeedDashboard();
  }

  resetToDefaults(): void {
    this.#loadSeedDashboard();
  }

  #loadSeedDashboard(): void {
    const dashboard = createSeedDashboard();

    if (!this.persistence.save(dashboard)) {
      this.#dashboard.set(null);
      this.#recoveryMessage.set('The Dashboard could not be saved locally.');
      return;
    }

    this.#dashboard.set(dashboard);
    this.#recoveryMessage.set(null);
  }
}
