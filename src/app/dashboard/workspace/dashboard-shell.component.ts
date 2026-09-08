import { Component, inject } from '@angular/core';
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
}
