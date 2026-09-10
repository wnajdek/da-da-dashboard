import { Component, computed, effect, inject, signal } from '@angular/core';
import { BROWSER_VIEWPORT } from '../grid-layout/browser-viewport';
import { DASHBOARD_GRID_CONFIG } from '../grid-layout/dashboard-grid.config';
import { DashboardStore } from './dashboard.store';
import { DashboardGridComponent } from '../grid-layout/dashboard-grid.component';
import { WidgetCatalogComponent } from '../widget-catalog/widget-catalog.component';

@Component({
  selector: 'app-dashboard-shell',
  imports: [WidgetCatalogComponent, DashboardGridComponent],
  templateUrl: './dashboard-shell.component.html',
  styleUrl: './dashboard-shell.component.scss',
})
export class DashboardShellComponent {
  protected readonly store = inject(DashboardStore);
  protected readonly isWidgetDrawerOpen = signal(false);
  protected readonly isNarrowScreen = computed(
    () => this.viewport.width() <= DASHBOARD_GRID_CONFIG.narrowScreenBreakpoint,
  );

  private readonly viewport = inject(BROWSER_VIEWPORT);

  constructor() {
    effect(() => {
      if (this.isNarrowScreen()) {
        this.isWidgetDrawerOpen.set(false);
      }
    });
  }

  protected openWidgetDrawer(): void {
    if (!this.isNarrowScreen()) {
      this.isWidgetDrawerOpen.set(true);
    }
  }

  protected closeWidgetDrawer(): void {
    this.isWidgetDrawerOpen.set(false);
  }
}
