import { Injectable, InjectionToken } from '@angular/core';
import { GridItemHTMLElement, GridStack, GridStackNode } from 'gridstack';
import type {
  WidgetInstance,
  WidgetLayoutChange,
} from '../workspace/dashboard.models';
import { DASHBOARD_GRID_CONFIG } from './dashboard-grid.config';
import {
  toGridStackWidget,
  toWidgetLayoutChange,
} from './gridstack-layout.adapter';

export interface DashboardGrid {
  initialize(
    element: HTMLElement,
    layoutCommitted: (changes: readonly WidgetLayoutChange[]) => void,
  ): void;
  synchronize(widgets: readonly WidgetInstance[]): void;
  setNarrowScreen(isNarrowScreen: boolean): void;
  destroy(): void;
}

export const DASHBOARD_GRID = new InjectionToken<DashboardGrid>(
  'Dashboard grid',
);

@Injectable()
export class GridStackDashboardGrid implements DashboardGrid {
  private grid: GridStack | null = null;
  private element: HTMLElement | null = null;

  initialize(
    element: HTMLElement,
    layoutCommitted: (changes: readonly WidgetLayoutChange[]) => void,
  ): void {
    this.element = element;
    this.grid = GridStack.init(
      {
        column: DASHBOARD_GRID_CONFIG.columns,
        cellHeight: DASHBOARD_GRID_CONFIG.cellHeight,
        margin: DASHBOARD_GRID_CONFIG.margin,
        handle: DASHBOARD_GRID_CONFIG.dragHandleSelector,
      },
      element,
    );
    this.grid.on('dragstop resizestop', () =>
      layoutCommitted(this.finalLayoutChanges()),
    );
  }

  synchronize(widgets: readonly WidgetInstance[]): void {
    const grid = this.grid;
    const element = this.element;

    if (grid === null || element === null) {
      return;
    }

    const widgetsById = new Map(widgets.map((widget) => [widget.id, widget]));
    const widgetIds = new Set(widgetsById.keys());

    for (const node of [...grid.engine.nodes]) {
      if (typeof node.id === 'string' && !widgetIds.has(node.id) && node.el) {
        grid.removeWidget(node.el, false);
      }
    }

    const items = [
      ...element.querySelectorAll<GridItemHTMLElement>('.grid-stack-item'),
    ];

    for (const item of items) {
      const node = item.gridstackNode;
      const id =
        node?.id === undefined ? item.getAttribute('gs-id') : String(node.id);
      const widget = id === null ? undefined : widgetsById.get(id);

      if (widget === undefined && node !== undefined) {
        grid.removeWidget(item, false);
      } else if (node === undefined && widget !== undefined) {
        grid.makeWidget(item, toGridStackWidget(widget));
      } else if (widget !== undefined) {
        grid.update(item, toGridStackWidget(widget));
      }
    }
  }

  setNarrowScreen(isNarrowScreen: boolean): void {
    if (this.grid === null) {
      return;
    }

    if (isNarrowScreen) {
      this.grid.disable();
      return;
    }

    this.grid.enable();
  }

  destroy(): void {
    this.grid?.destroy(false);
    this.grid = null;
    this.element = null;
  }

  private finalLayoutChanges(): readonly WidgetLayoutChange[] {
    if (this.grid === null) {
      return [];
    }

    return this.grid.engine.nodes
      .map((node: GridStackNode) => toWidgetLayoutChange(node))
      .filter((change): change is WidgetLayoutChange => change !== null);
  }
}
