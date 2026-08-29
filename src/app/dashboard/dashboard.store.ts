import { Injectable, Signal, signal } from '@angular/core';
import { Dashboard, WidgetInstance, WidgetType } from './dashboard.models';
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

  addWidget(type: WidgetType): void {
    const dashboard = this.#dashboard();

    if (dashboard === null) {
      return;
    }

    const updatedDashboard: Dashboard = {
      ...dashboard,
      widgets: [...dashboard.widgets, createDefaultWidget(type, dashboard)],
    };

    if (this.persistence.save(updatedDashboard)) {
      this.#dashboard.set(updatedDashboard);
    }
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

function createDefaultWidget(
  type: WidgetType,
  dashboard: Dashboard,
): WidgetInstance {
  const layout = {
    x: 0,
    y: Math.max(
      0,
      ...dashboard.widgets.map((widget) => widget.layout.y + widget.layout.h),
    ),
    w: 3,
    h: 2,
  };
  const id = crypto.randomUUID();

  switch (type) {
    case 'kpi':
      return {
        id,
        type,
        layout,
        configuration: {
          title: 'Monthly revenue',
          dataSource: 'monthly-revenue',
          displayFormat: 'currency',
        },
      };
    case 'time-series':
      return {
        id,
        type,
        layout,
        configuration: {
          title: 'Revenue trend',
          dataSource: 'monthly-revenue-trend',
        },
      };
    case 'notes':
      return {
        id,
        type,
        layout,
        configuration: {
          title: 'New note',
          body: 'Add your notes here.',
        },
      };
  }
}
