import { computed, Injectable, Signal, signal } from '@angular/core';
import {
  Dashboard,
  WidgetConfigurationUpdate,
  WidgetInstance,
  WidgetLayoutChange,
  WidgetType,
} from './dashboard.models';
import { DashboardPersistenceService } from './dashboard-persistence.service';
import { createSeedDashboard } from './dashboard.seed';
import { DemoDataService } from './demo-data.service';
import { BUILT_IN_WIDGET_REGISTRY, WidgetDefinition } from './widget-registry';

const WIDGET_REMOVAL_UNDO_DURATION_MS = 5_000;

interface PendingWidgetRemoval {
  readonly widget: WidgetInstance;
  readonly index: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  readonly #dashboard = signal<Dashboard | null>(null);
  readonly #recoveryMessage = signal<string | null>(null);
  readonly #selectedWidgetId = signal<string | null>(null);
  readonly #pendingWidgetRemoval = signal<PendingWidgetRemoval | null>(null);
  #undoRemovalTimer: ReturnType<typeof setTimeout> | null = null;

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
  readonly canUndoRemoval = computed(
    () => this.#pendingWidgetRemoval() !== null,
  );

  constructor(
    private readonly persistence: DashboardPersistenceService,
    private readonly demoData: DemoDataService,
  ) {
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
      widgets: [
        ...dashboard.widgets,
        createDefaultWidget(BUILT_IN_WIDGET_REGISTRY[type], dashboard),
      ],
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

  removeWidget(id: string): void {
    const dashboard = this.#dashboard();

    if (dashboard === null) {
      return;
    }

    const index = dashboard.widgets.findIndex((widget) => widget.id === id);

    if (index === -1) {
      return;
    }

    const widget = dashboard.widgets[index];
    const updatedDashboard: Dashboard = {
      ...dashboard,
      widgets: dashboard.widgets.filter((candidate) => candidate.id !== id),
    };

    if (!this.persistence.save(updatedDashboard)) {
      return;
    }

    this.#clearPendingWidgetRemoval();
    this.#dashboard.set(updatedDashboard);
    this.#selectedWidgetId.set(null);
    this.#pendingWidgetRemoval.set({ widget, index });
    this.#undoRemovalTimer = setTimeout(() => {
      this.#pendingWidgetRemoval.set(null);
      this.#undoRemovalTimer = null;
    }, WIDGET_REMOVAL_UNDO_DURATION_MS);
  }

  undoWidgetRemoval(): void {
    const dashboard = this.#dashboard();
    const pendingRemoval = this.#pendingWidgetRemoval();

    if (dashboard === null || pendingRemoval === null) {
      return;
    }

    const restoredDashboard: Dashboard = {
      ...dashboard,
      widgets: [
        ...dashboard.widgets.slice(0, pendingRemoval.index),
        pendingRemoval.widget,
        ...dashboard.widgets.slice(pendingRemoval.index),
      ],
    };

    if (this.persistence.save(restoredDashboard)) {
      this.#dashboard.set(restoredDashboard);
      this.#clearPendingWidgetRemoval();
    }
  }

  refreshDemoData(): void {
    this.demoData.refresh();
  }

  commitGridLayoutChange(changes: readonly WidgetLayoutChange[]): void {
    const dashboard = this.#dashboard();

    if (dashboard === null || changes.length === 0) {
      return;
    }

    const layoutsByWidgetId = new Map(
      changes.map((change) => [change.id, change.layout]),
    );
    const updatedDashboard: Dashboard = {
      ...dashboard,
      widgets: dashboard.widgets.map((widget) => {
        const layout = layoutsByWidgetId.get(widget.id);

        return layout === undefined ? widget : { ...widget, layout };
      }),
    };

    if (this.persistence.save(updatedDashboard)) {
      this.#dashboard.set(updatedDashboard);
    }
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

  #clearPendingWidgetRemoval(): void {
    if (this.#undoRemovalTimer !== null) {
      clearTimeout(this.#undoRemovalTimer);
      this.#undoRemovalTimer = null;
    }

    this.#pendingWidgetRemoval.set(null);
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
  definition: WidgetDefinition,
  dashboard: Dashboard,
): WidgetInstance {
  const layout = {
    x: 0,
    y: Math.max(
      0,
      ...dashboard.widgets.map((widget) => widget.layout.y + widget.layout.h),
    ),
    ...definition.preferredLayout,
  };

  return {
    id: crypto.randomUUID(),
    type: definition.type,
    layout,
    configuration: definition.defaultConfiguration,
  } as WidgetInstance;
}
