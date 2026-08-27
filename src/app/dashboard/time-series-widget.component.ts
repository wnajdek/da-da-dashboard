import { Component, input } from '@angular/core';
import { TimeSeriesWidgetInstance } from './dashboard.models';

@Component({
  selector: 'app-time-series-widget',
  template: `
    <article class="widget-card">
      <p class="widget-kind">Time series</p>
      <h2>{{ widget().configuration.title }}</h2>
      <div class="trend" aria-label="Revenue trend: January 94 thousand, February 101 thousand, March 109 thousand, April 117 thousand">
        <span style="height: 55%"></span><span style="height: 63%"></span>
        <span style="height: 73%"></span><span style="height: 86%"></span>
      </div>
      <p class="widget-caption">Jan–Apr · steady growth</p>
    </article>
  `,
  styleUrl: './widget-card.scss'
})
export class TimeSeriesWidgetComponent {
  readonly widget = input.required<TimeSeriesWidgetInstance>();
}
