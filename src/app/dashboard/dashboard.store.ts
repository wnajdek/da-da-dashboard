import { computed, Injectable, Signal, signal } from '@angular/core';
import {
  Dashboard,
  isValidGridLayout,
  isValidGridLayoutSize,
  WidgetConfigurationChange,
  WidgetCreation,
  WidgetInstance,
  WidgetLayoutChange,
} from './dashboard.models';
import { DashboardPersistenceService } from './dashboard-persistence.service';
import { createSeedDashboard } from './dashboard.seed';
import { isJsonObject, isRecord } from './json-value';

const WIDGET_REMOVAL_UNDO_DURATION_MS = 5_000;

interface PendingWidgetRemoval {
  readonly widget: WidgetInstance;
  readonly index: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private readonly dashboardState = signal<Dashboard | null>(null);
  private readonly recoveryMessageState = signal<string | null>(null);
  private readonly pendingWidgetRemovalState =
    signal<PendingWidgetRemoval | null>(null);
  private undoRemovalTimer: ReturnType<typeof setTimeout> | null = null;

  readonly dashboard: Signal<Dashboard | null> =
    this.dashboardState.asReadonly();
  readonly recoveryMessage: Signal<string | null> =
    this.recoveryMessageState.asReadonly();
  readonly canUndoRemoval = computed(
    () => this.pendingWidgetRemovalState() !== null,
  );

  constructor(private readonly persistence: DashboardPersistenceService) {
    const result = this.persistence.load();

    if (result.status === 'ready') {
      this.dashboardState.set(result.dashboard);
      return;
    }

    if (result.status === 'recovery') {
      this.recoveryMessageState.set(result.message);
      return;
    }

    this.loadSeedDashboard();
  }

  resetToDefaults(): void {
    this.clearPendingWidgetRemoval();
    this.loadSeedDashboard();
  }

  addWidget(creation: WidgetCreation): void {
    const dashboard = this.dashboardState();

    if (dashboard === null || !isWidgetCreation(creation)) {
      return;
    }

    const widget: WidgetInstance = {
      id: crypto.randomUUID(),
      type: creation.type,
      configuration: creation.configuration,
      layout: {
        x: 0,
        y: this.nextWidgetY(dashboard),
        w: creation.preferredLayout.w,
        h: creation.preferredLayout.h,
      },
    };
    const updatedDashboard: Dashboard = {
      ...dashboard,
      widgets: [...dashboard.widgets, widget],
    };

    if (this.persistence.save(updatedDashboard)) {
      this.dashboardState.set(updatedDashboard);
    }
  }

  updateWidgetConfiguration(change: WidgetConfigurationChange): void {
    const dashboard = this.dashboardState();

    if (dashboard === null || !isWidgetConfigurationChange(change)) {
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
      this.dashboardState.set(updatedDashboard);
    }
  }

  removeWidget(id: string): void {
    const dashboard = this.dashboardState();

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

    this.clearPendingWidgetRemoval();
    this.dashboardState.set(updatedDashboard);
    this.pendingWidgetRemovalState.set({ widget, index });
    this.undoRemovalTimer = setTimeout(() => {
      this.pendingWidgetRemovalState.set(null);
      this.undoRemovalTimer = null;
    }, WIDGET_REMOVAL_UNDO_DURATION_MS);
  }

  undoWidgetRemoval(): void {
    const dashboard = this.dashboardState();
    const pendingRemoval = this.pendingWidgetRemovalState();

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
      this.dashboardState.set(restoredDashboard);
      this.clearPendingWidgetRemoval();
    }
  }

  commitGridLayoutChange(changes: readonly WidgetLayoutChange[]): void {
    const dashboard = this.dashboardState();

    if (dashboard === null || changes.length === 0) {
      return;
    }

    const layoutsByWidgetId = new Map(
      changes
        .filter(isWidgetLayoutChange)
        .map((change) => [change.id, change.layout]),
    );
    let changed = false;
    const updatedDashboard: Dashboard = {
      ...dashboard,
      widgets: dashboard.widgets.map((widget) => {
        const layout = layoutsByWidgetId.get(widget.id);

        if (layout === undefined || areLayoutsEqual(widget.layout, layout)) {
          return widget;
        }

        changed = true;
        return { ...widget, layout };
      }),
    };

    if (changed && this.persistence.save(updatedDashboard)) {
      this.dashboardState.set(updatedDashboard);
    }
  }

  private loadSeedDashboard(): void {
    const dashboard = createSeedDashboard();

    if (!this.persistence.save(dashboard)) {
      this.dashboardState.set(null);
      this.recoveryMessageState.set(
        'The Dashboard could not be saved locally.',
      );
      return;
    }

    this.dashboardState.set(dashboard);
    this.recoveryMessageState.set(null);
  }

  private clearPendingWidgetRemoval(): void {
    if (this.undoRemovalTimer !== null) {
      clearTimeout(this.undoRemovalTimer);
      this.undoRemovalTimer = null;
    }

    this.pendingWidgetRemovalState.set(null);
  }

  private nextWidgetY(dashboard: Dashboard): number {
    return dashboard.widgets.reduce(
      (bottom, widget) => Math.max(bottom, widget.layout.y + widget.layout.h),
      0,
    );
  }
}

function isWidgetCreation(value: unknown): value is WidgetCreation {
  return (
    isRecord(value) &&
    typeof value['type'] === 'string' &&
    value['type'].length > 0 &&
    isJsonObject(value['configuration']) &&
    isValidGridLayoutSize(value['preferredLayout'])
  );
}

function isWidgetConfigurationChange(
  value: unknown,
): value is WidgetConfigurationChange {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    isJsonObject(value['configuration'])
  );
}

function isWidgetLayoutChange(value: unknown): value is WidgetLayoutChange {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    isValidGridLayout(value['layout'])
  );
}

function areLayoutsEqual(
  left: WidgetInstance['layout'],
  right: WidgetInstance['layout'],
): boolean {
  return (
    left.x === right.x &&
    left.y === right.y &&
    left.w === right.w &&
    left.h === right.h
  );
}
