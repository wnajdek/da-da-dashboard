import { Component, inject } from '@angular/core';
import { DashboardStore } from './dashboard.store';
import { DashboardGridComponent } from './dashboard-grid.component';

@Component({
  selector: 'app-dashboard-shell',
  imports: [DashboardGridComponent],
  template: `
    <main class="dashboard">
      @if (store.recoveryMessage(); as recoveryMessage) {
        <section class="recovery" aria-labelledby="recovery-title">
          <p class="eyebrow">Dashboard recovery</p>
          <h1 id="recovery-title">Saved Dashboard needs attention</h1>
          <p>{{ recoveryMessage }}</p>
          <button type="button" (click)="store.resetToDefaults()">
            Reset to defaults
          </button>
        </section>
      } @else if (store.dashboard(); as dashboard) {
        <header>
          <p class="eyebrow">Dashboard</p>
          <h1>{{ dashboard.title }}</h1>
          <p class="subtitle">
            A seeded workspace for exploring your team's pulse.
          </p>
        </header>

        <app-dashboard-grid
          [dashboard]="dashboard"
          (layoutCommitted)="store.commitGridLayoutChange($event)"
          (widgetRemoved)="store.removeWidget($event)"
        />

        @if (store.canUndoRemoval()) {
          <aside class="removal-notice" aria-live="polite">
            <span>Widget removed.</span>
            <button
              type="button"
              data-testid="undo-removal"
              (click)="store.undoWidgetRemoval()"
            >
              Undo
            </button>
          </aside>
        }
      }
    </main>
  `,
  styleUrl: './dashboard-shell.component.scss',
})
export class DashboardShellComponent {
  protected readonly store = inject(DashboardStore);
}
