import {
  computed,
  inject,
  Injectable,
  InjectionToken,
  Signal,
  signal,
} from '@angular/core';
import {
  decodeWidgetConfigurationChange,
  decodeWidgetCreation,
  decodeWidgetInstanceId,
  decodeWidgetLayoutChange,
} from './dashboard-decoder';
import type {
  Dashboard,
  WidgetConfigurationChange,
  WidgetCreation,
  WidgetInstance,
  WidgetLayoutChange,
} from './dashboard.models';
import { DashboardPersistenceService } from './dashboard-persistence.service';
import { createSeedDashboard } from './dashboard.seed';
import { decodeJsonObject } from './json-value';

const WIDGET_REMOVAL_UNDO_DURATION_MS = 5_000;
const PERSISTENCE_FAILURE_MESSAGE =
  'The requested Dashboard change could not be saved locally.';

interface PendingWidgetRemoval {
  readonly widget: WidgetInstance;
  readonly index: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private readonly persistence = inject(DashboardPersistenceService);
  private readonly createWidgetInstanceId = inject(WIDGET_INSTANCE_ID_FACTORY);
  private readonly dashboardState = signal<Dashboard | null>(null);
  private readonly recoveryMessageState = signal<string | null>(null);
  private readonly persistenceFailureMessageState = signal<string | null>(null);
  private readonly pendingWidgetRemovalState =
    signal<PendingWidgetRemoval | null>(null);
  private undoRemovalTimer: ReturnType<typeof setTimeout> | null = null;

  readonly dashboard: Signal<Dashboard | null> =
    this.dashboardState.asReadonly();
  readonly recoveryMessage: Signal<string | null> =
    this.recoveryMessageState.asReadonly();
  readonly persistenceFailureMessage: Signal<string | null> =
    this.persistenceFailureMessageState.asReadonly();
  readonly canUndoRemoval = computed(
    () => this.pendingWidgetRemovalState() !== null,
  );

  constructor() {
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

  resetToDefaults(): DashboardCommandResult {
    const result = this.loadSeedDashboard();

    if (result.status === 'success') {
      this.clearPendingWidgetRemoval();
    }

    return result;
  }

  addWidget(creation: WidgetCreation): DashboardCommandResult {
    const dashboard = this.dashboardState();

    const decodedCreation = decodeWidgetCreation(creation);

    if (decodedCreation === null) {
      return { status: 'invalid-input' };
    }

    if (dashboard === null) {
      return { status: 'missing-target' };
    }

    const widget: WidgetInstance = {
      id: this.createWidgetInstanceId(),
      type: decodedCreation.type,
      configuration: decodedCreation.configuration,
      layout: {
        x: 0,
        y: this.nextWidgetY(dashboard),
        w: decodedCreation.preferredLayout.w,
        h: decodedCreation.preferredLayout.h,
      },
    };
    const updatedDashboard: Dashboard = {
      ...dashboard,
      widgets: [...dashboard.widgets, widget],
    };

    return this.persistDashboard(updatedDashboard);
  }

  duplicateWidget(id: string): DashboardCommandResult {
    const dashboard = this.dashboardState();

    if (decodeWidgetInstanceId(id) === null) {
      return { status: 'invalid-input' };
    }

    if (dashboard === null) {
      return { status: 'missing-target' };
    }

    const source = dashboard.widgets.find((widget) => widget.id === id);

    if (source === undefined) {
      return { status: 'missing-target' };
    }

    const configuration = decodeJsonObject(source.configuration);

    if (configuration === null) {
      return { status: 'invalid-input' };
    }

    const widget: WidgetInstance = {
      id: this.createWidgetInstanceId(),
      type: source.type,
      configuration,
      layout: {
        x: 0,
        y: this.nextWidgetY(dashboard),
        w: source.layout.w,
        h: source.layout.h,
      },
    };
    const updatedDashboard: Dashboard = {
      ...dashboard,
      widgets: [...dashboard.widgets, widget],
    };

    return this.persistDashboard(updatedDashboard);
  }

  updateWidgetConfiguration(
    change: WidgetConfigurationChange,
  ): DashboardCommandResult {
    const dashboard = this.dashboardState();

    const decodedChange = decodeWidgetConfigurationChange(change);

    if (decodedChange === null) {
      return { status: 'invalid-input' };
    }

    if (dashboard === null) {
      return { status: 'missing-target' };
    }

    const widget = dashboard.widgets.find(
      (candidate) => candidate.id === decodedChange.id,
    );

    if (widget === undefined) {
      return { status: 'missing-target' };
    }

    const updatedDashboard: Dashboard = {
      ...dashboard,
      widgets: dashboard.widgets.map((candidate) =>
        candidate.id === decodedChange.id
          ? { ...candidate, configuration: decodedChange.configuration }
          : candidate,
      ),
    };

    return this.persistDashboard(updatedDashboard);
  }

  removeWidget(id: string): DashboardCommandResult {
    const dashboard = this.dashboardState();

    if (decodeWidgetInstanceId(id) === null) {
      return { status: 'invalid-input' };
    }

    if (dashboard === null) {
      return { status: 'missing-target' };
    }

    const index = dashboard.widgets.findIndex((widget) => widget.id === id);

    if (index === -1) {
      return { status: 'missing-target' };
    }

    const widget = dashboard.widgets[index];
    const updatedDashboard: Dashboard = {
      ...dashboard,
      widgets: dashboard.widgets.filter((candidate) => candidate.id !== id),
    };

    const result = this.persistDashboard(updatedDashboard);

    if (result.status !== 'success') {
      return result;
    }

    this.clearPendingWidgetRemoval();
    this.pendingWidgetRemovalState.set({ widget, index });
    this.undoRemovalTimer = setTimeout(() => {
      this.pendingWidgetRemovalState.set(null);
      this.undoRemovalTimer = null;
    }, WIDGET_REMOVAL_UNDO_DURATION_MS);
    return result;
  }

  undoWidgetRemoval(): DashboardCommandResult {
    const dashboard = this.dashboardState();
    const pendingRemoval = this.pendingWidgetRemovalState();

    if (dashboard === null || pendingRemoval === null) {
      return { status: 'missing-target' };
    }

    const restoredDashboard: Dashboard = {
      ...dashboard,
      widgets: [
        ...dashboard.widgets.slice(0, pendingRemoval.index),
        pendingRemoval.widget,
        ...dashboard.widgets.slice(pendingRemoval.index),
      ],
    };

    const result = this.persistDashboard(restoredDashboard);

    if (result.status === 'success') {
      this.clearPendingWidgetRemoval();
    }

    return result;
  }

  commitGridLayoutChange(
    changes: readonly WidgetLayoutChange[],
  ): DashboardCommandResult {
    const dashboard = this.dashboardState();

    if (!Array.isArray(changes) || changes.length === 0) {
      return { status: 'invalid-input' };
    }

    if (dashboard === null) {
      return { status: 'missing-target' };
    }

    const decodedChanges = changes.map(decodeWidgetLayoutChange);

    if (decodedChanges.some((change) => change === null)) {
      return { status: 'invalid-input' };
    }

    const validChanges = decodedChanges.filter(
      (change): change is WidgetLayoutChange => change !== null,
    );
    const layoutsByWidgetId = new Map(
      validChanges.map((change) => [change.id, change.layout]),
    );

    if (
      [...layoutsByWidgetId.keys()].some(
        (id) => !dashboard.widgets.some((widget) => widget.id === id),
      )
    ) {
      return { status: 'missing-target' };
    }
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

    if (!changed) {
      return { status: 'success' };
    }

    return this.persistDashboard(updatedDashboard);
  }

  private loadSeedDashboard(): DashboardCommandResult {
    const dashboard = createSeedDashboard();

    if (!this.persistence.save(dashboard)) {
      if (
        this.dashboardState() === null &&
        this.recoveryMessageState() === null
      ) {
        this.recoveryMessageState.set(
          'The Dashboard could not be saved locally.',
        );
      }
      this.persistenceFailureMessageState.set(PERSISTENCE_FAILURE_MESSAGE);
      return { status: 'storage-failure' };
    }

    this.dashboardState.set(dashboard);
    this.recoveryMessageState.set(null);
    this.persistenceFailureMessageState.set(null);
    return { status: 'success' };
  }

  private persistDashboard(dashboard: Dashboard): DashboardCommandResult {
    if (!this.persistence.save(dashboard)) {
      this.persistenceFailureMessageState.set(PERSISTENCE_FAILURE_MESSAGE);
      return { status: 'storage-failure' };
    }

    this.dashboardState.set(dashboard);
    this.persistenceFailureMessageState.set(null);
    return { status: 'success' };
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

export type DashboardCommandResult =
  | { readonly status: 'success' }
  | { readonly status: 'invalid-input' }
  | { readonly status: 'missing-target' }
  | { readonly status: 'storage-failure' };

export type WidgetInstanceIdFactory = () => string;

export const WIDGET_INSTANCE_ID_FACTORY =
  new InjectionToken<WidgetInstanceIdFactory>('Widget Instance ID factory', {
    providedIn: 'root',
    factory: () => () => crypto.randomUUID(),
  });

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
