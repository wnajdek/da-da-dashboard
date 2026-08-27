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
      <header>
        <p class="eyebrow">Dashboard</p>
        <h1>{{ store.dashboard().title }}</h1>
        <p class="subtitle">
          A seeded workspace for exploring your team's pulse.
        </p>
      </header>

      <section class="widget-grid" aria-label="Dashboard widgets">
        @for (widget of store.dashboard().widgets; track widget.id) {
          @switch (widget.type) {
            @case ('kpi') {
              <app-kpi-widget
                [widget]="widget"
                [value]="demoData.kpiValueFor(widget.configuration.dataSource)"
              />
            }
            @case ('time-series') {
              <app-time-series-widget
                [widget]="widget"
                [values]="
                  demoData.timeSeriesValuesFor(widget.configuration.dataSource)
                "
              />
            }
            @case ('notes') {
              <app-notes-widget [widget]="widget" />
            }
          }
        }
      </section>
    </main>
  `,
  styleUrl: './dashboard-shell.component.scss',
})
export class DashboardShellComponent {
  protected readonly store = inject(DashboardStore);
  protected readonly demoData = inject(DemoDataService);
}
