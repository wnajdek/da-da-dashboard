import { Component, inject } from '@angular/core';
import { WidgetType } from './dashboard.models';
import { DashboardStore } from './dashboard.store';
import { WidgetConfigurationEditorComponent } from './widget-configuration-editor.component';
import { DashboardGridComponent } from './dashboard-grid.component';

@Component({
  selector: 'app-dashboard-shell',
  imports: [DashboardGridComponent, WidgetConfigurationEditorComponent],
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
          <div class="add-widget">
            <label for="widget-type">Add a widget</label>
            <select id="widget-type" (change)="selectWidgetType($event)">
              @for (widgetType of widgetTypes; track widgetType) {
                <option [value]="widgetType">{{ widgetType }}</option>
              }
            </select>
            <button
              type="button"
              data-testid="add-widget"
              (click)="store.addWidget(selectedWidgetType)"
            >
              Add widget
            </button>
            <button
              type="button"
              data-testid="refresh-dashboard"
              (click)="store.refreshDemoData()"
            >
              Refresh demo data
            </button>
          </div>
        </header>

        <app-dashboard-grid
          [dashboard]="dashboard"
          (layoutCommitted)="store.commitGridLayoutChange($event)"
          (widgetSelected)="store.selectWidget($event)"
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

        @if (store.selectedWidget(); as selectedWidget) {
          <app-widget-configuration-editor
            [widget]="selectedWidget"
            (configurationSaved)="
              store.updateWidgetConfiguration(selectedWidget.id, $event)
            "
            (closed)="store.clearWidgetSelection()"
          />
        }
      }
    </main>
  `,
  styleUrl: './dashboard-shell.component.scss',
})
export class DashboardShellComponent {
  protected readonly store = inject(DashboardStore);
  protected readonly widgetTypes: readonly WidgetType[] = [
    'kpi',
    'time-series',
    'notes',
  ];
  protected selectedWidgetType: WidgetType = 'kpi';

  protected selectWidgetType(event: Event): void {
    const type = (event.target as HTMLSelectElement).value;

    if (type === 'kpi' || type === 'time-series' || type === 'notes') {
      this.selectedWidgetType = type;
    }
  }
}
