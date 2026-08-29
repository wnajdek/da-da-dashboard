import { Component, inject, input } from '@angular/core';
import { DemoDataService } from './demo-data.service';
import { TimeSeriesWidgetInstance, WidgetContext } from './dashboard.models';

@Component({
  selector: 'app-time-series-widget',
  template: `
    <article class="widget-card">
      <p class="widget-kind">Time series</p>
      <h2>{{ context().widget.configuration.title }}</h2>
      <div class="trend" [attr.aria-label]="trendSummary()">
        @for (value of values(); track $index) {
          <span [style.height.%]="value / 1400"></span>
        }
      </div>
      <p class="widget-caption">Jan–Apr · steady growth</p>
    </article>
  `,
  styleUrl: './widget-card.scss',
})
export class TimeSeriesWidgetComponent {
  readonly context = input.required<WidgetContext<TimeSeriesWidgetInstance>>();
  protected readonly demoData = inject(DemoDataService);

  protected values(): readonly number[] {
    return this.demoData.timeSeriesValuesFor(
      this.context().widget.configuration.dataSource,
    );
  }

  protected trendSummary(): string {
    return `${this.context().widget.configuration.title}: ${this.values()
      .map((value) => `$${value / 1000}k`)
      .join(', ')}`;
  }
}
