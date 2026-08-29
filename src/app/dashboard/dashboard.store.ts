import { computed, Injectable, Signal, signal } from '@angular/core';
import {
  Dashboard,
  WidgetConfigurationUpdate,
  WidgetInstance,
  WidgetType,
} from './dashboard.models';
import { DashboardPersistenceService } from './dashboard-persistence.service';
import { createSeedDashboard } from './dashboard.seed';

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  readonly #dashboard = signal<Dashboard | null>(null);
  readonly #recoveryMessage = signal<string | null>(null);
  readonly #selectedWidgetId = signal<string | null>(null);

  readonly dashboard: Signal<Dashboard | null> = this.#dashboard.asReadonly();
  readonly recoveryMessage: Signal<string | null> =
    this.#recoveryMessage.asReadonly();
  readonly selectedWidget = computed(() => {
    const dashboard = this.#dashboard();
    const selectedWidgetId = this.#selectedWidgetId();

    return (
      dashboard?.widgets.find((widget) => widget.id === selectedWidgetId) ??
      null
    );
  });

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

  selectWidget(id: string): void {
    if (this.#dashboard()?.widgets.some((widget) => widget.id === id)) {
      this.#selectedWidgetId.set(id);
    }
  }

  clearWidgetSelection(): void {
    this.#selectedWidgetId.set(null);
  }

  updateWidgetConfiguration(
    id: string,
    update: WidgetConfigurationUpdate,
  ): void {
    const dashboard = this.#dashboard();

    if (dashboard === null) {
      return;
    }

    const updatedDashboard: Dashboard = {
      ...dashboard,
      widgets: dashboard.widgets.map((widget) =>
        widget.id === id ? updateWidgetConfiguration(widget, update) : widget,
      ),
    };

    if (this.persistence.save(updatedDashboard)) {
      this.#dashboard.set(updatedDashboard);
      this.#selectedWidgetId.set(null);
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

function updateWidgetConfiguration(
  widget: WidgetInstance,
  update: WidgetConfigurationUpdate,
): WidgetInstance {
  switch (widget.type) {
    case 'kpi':
      return update.type === 'kpi'
        ? { ...widget, configuration: update.configuration }
        : widget;
    case 'time-series':
      return update.type === 'time-series'
        ? { ...widget, configuration: update.configuration }
        : widget;
    case 'notes':
      return update.type === 'notes'
        ? { ...widget, configuration: update.configuration }
        : widget;
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
