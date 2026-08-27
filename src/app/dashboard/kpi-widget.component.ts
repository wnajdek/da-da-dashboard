import { CurrencyPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { KpiWidgetInstance } from './dashboard.models';

@Component({
  selector: 'app-kpi-widget',
  imports: [CurrencyPipe],
  template: `
    <article class="widget-card">
      <p class="widget-kind">KPI</p>
      <h2>{{ widget().configuration.title }}</h2>
      <p class="kpi-value">{{ value() | currency: 'USD' : 'symbol' : '1.0-0' }}</p>
      <p class="widget-caption">Current month</p>
    </article>
  `,
  styleUrl: './widget-card.scss'
})
export class KpiWidgetComponent {
  readonly widget = input.required<KpiWidgetInstance>();
  readonly value = input.required<number>();
}
