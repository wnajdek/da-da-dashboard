import { Component, inject, signal } from '@angular/core';
import { DashboardStore } from './dashboard.store';
import { DashboardGridComponent } from '../grid-layout/dashboard-grid.component';
import type { WidgetInstallation } from '../widget-installation/widget-installation-persistence.service';
import { WidgetRuntimeService } from '../widget-installation/widget-runtime.service';

@Component({
  selector: 'app-dashboard-shell',
  imports: [DashboardGridComponent],
  templateUrl: './dashboard-shell.component.html',
  styleUrl: './dashboard-shell.component.scss',
})
export class DashboardShellComponent {
  protected readonly store = inject(DashboardStore);
  protected readonly runtime = inject(WidgetRuntimeService);
  protected readonly manifestUrl = signal('');

  protected updateManifestUrl(event: Event): void {
    const input = event.target;

    if (input instanceof HTMLInputElement) {
      this.manifestUrl.set(input.value);
    }
  }

  protected async installManifest(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const result = await this.runtime.installManifest(this.manifestUrl());

    if (result.status === 'installed') {
      this.manifestUrl.set('');
    }
  }

  protected addWidget(installation: WidgetInstallation): void {
    this.store.addWidget({
      type: installation.type,
      configuration: installation.defaultConfiguration,
      preferredLayout: installation.preferredLayout,
    });
  }

  protected removeInstallation(installation: WidgetInstallation): void {
    this.runtime.removeInstallation(installation.type);
  }
}
