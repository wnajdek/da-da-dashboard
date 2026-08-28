import { Component, inject } from '@angular/core';
import { DemoDataService } from './demo-data.service';
import { DashboardStore } from './dashboard.store';
import { KpiWidgetComponent } from './kpi-widget.component';
import { NotesWidgetComponent } from './notes-widget.component';
import { TimeSeriesWidgetComponent } from './time-series-widget.component';

@Component({
  selector: 'app-dashboard-shell',
  imports: [
    KpiWidgetComponent,
    TimeSeriesWidgetComponent,
    NotesWidgetComponent,
  ],
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

        <section class="widget-grid" aria-label="Dashboard widgets">
          @for (widget of dashboard.widgets; track widget.id) {
            @switch (widget.type) {
              @case ('kpi') {
                <app-kpi-widget
                  [widget]="widget"
                  [value]="
                    demoData.kpiValueFor(widget.configuration.dataSource)
                  "
                />
              }
              @case ('time-series') {
                <app-time-series-widget
                  [widget]="widget"
                  [values]="
                    demoData.timeSeriesValuesFor(
                      widget.configuration.dataSource
                    )
                  "
                />
              }
              @case ('notes') {
                <app-notes-widget [widget]="widget" />
              }
            }
          }
        </section>
      }
    </main>
  `,
  styleUrl: './dashboard-shell.component.scss',
})
export class DashboardShellComponent {
  protected readonly store = inject(DashboardStore);
  protected readonly demoData = inject(DemoDataService);
}
