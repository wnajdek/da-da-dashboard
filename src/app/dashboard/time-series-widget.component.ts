import { Component, input } from '@angular/core';
import { TimeSeriesWidgetInstance } from './dashboard.models';

@Component({
  selector: 'app-time-series-widget',
  template: `
    <article class="widget-card">
      <p class="widget-kind">Time series</p>
      <h2>{{ widget().configuration.title }}</h2>
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
  readonly widget = input.required<TimeSeriesWidgetInstance>();
  readonly values = input.required<readonly number[]>();

  protected trendSummary(): string {
    return `Revenue trend: ${this.values()
      .map((value) => `$${value / 1000}k`)
      .join(', ')}`;
  }
}
