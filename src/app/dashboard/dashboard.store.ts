import { computed, Injectable, Signal, signal } from '@angular/core';
import {
  Dashboard,
  WidgetConfigurationChange,
  WidgetCreation,
  WidgetInstance,
  WidgetLayoutChange,
} from './dashboard.models';
import { DashboardPersistenceService } from './dashboard-persistence.service';
import { createSeedDashboard } from './dashboard.seed';
import { isJsonObject } from './json-value';

const WIDGET_REMOVAL_UNDO_DURATION_MS = 5_000;

interface PendingWidgetRemoval {
  readonly widget: WidgetInstance;
  readonly index: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  readonly #dashboard = signal<Dashboard | null>(null);
  readonly #recoveryMessage = signal<string | null>(null);
  readonly #pendingWidgetRemoval = signal<PendingWidgetRemoval | null>(null);
  #undoRemovalTimer: ReturnType<typeof setTimeout> | null = null;

  readonly dashboard: Signal<Dashboard | null> = this.#dashboard.asReadonly();
  readonly recoveryMessage: Signal<string | null> =
    this.#recoveryMessage.asReadonly();
  readonly canUndoRemoval = computed(
    () => this.#pendingWidgetRemoval() !== null,
  );

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

  addWidget(creation: WidgetCreation): void {
    const dashboard = this.#dashboard();

    if (dashboard === null || !isJsonObject(creation.configuration)) {
      return;
    }

    const widget: WidgetInstance = {
      id: crypto.randomUUID(),
      type: creation.type,
      configuration: creation.configuration,
      layout: {
        x: 0,
        y: this.#nextWidgetY(dashboard),
        w: creation.preferredLayout.w,
        h: creation.preferredLayout.h,
      },
    };
    const updatedDashboard: Dashboard = {
      ...dashboard,
      widgets: [...dashboard.widgets, widget],
    };

    if (this.persistence.save(updatedDashboard)) {
      this.#dashboard.set(updatedDashboard);
    }
  }

  updateWidgetConfiguration(change: WidgetConfigurationChange): void {
    const dashboard = this.#dashboard();

    if (dashboard === null || !isJsonObject(change.configuration)) {
      return;
    }

    const widget = dashboard.widgets.find(
      (candidate) => candidate.id === change.id,
    );

    if (widget === undefined) {
      return;
    }

    const updatedDashboard: Dashboard = {
      ...dashboard,
      widgets: dashboard.widgets.map((candidate) =>
        candidate.id === change.id
          ? { ...candidate, configuration: change.configuration }
          : candidate,
      ),
    };

    if (this.persistence.save(updatedDashboard)) {
      this.#dashboard.set(updatedDashboard);
    }
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

  #nextWidgetY(dashboard: Dashboard): number {
    return dashboard.widgets.reduce(
      (bottom, widget) => Math.max(bottom, widget.layout.y + widget.layout.h),
      0,
    );
  }
}
