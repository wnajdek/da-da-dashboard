import { Routes } from '@angular/router';
import { WidgetInstallationsPageComponent } from './dashboard/widget-installations/widget-installations-page.component';
import { DashboardShellComponent } from './dashboard/workspace/dashboard-shell.component';

export const routes: Routes = [
  { path: '', component: DashboardShellComponent },
  { path: 'widgets', component: WidgetInstallationsPageComponent },
  { path: '**', redirectTo: '' },
];
