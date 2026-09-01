import { CurrencyPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { KpiWidgetConfiguration } from './dashboard.models';
import { WidgetDataGateway } from './widget-data-gateway';

@Component({
  selector: 'app-kpi-widget',
  imports: [CurrencyPipe],
  template: `
    <article class="widget-card">
      <p class="widget-kind">KPI</p>
      <h2>{{ configuration().title }}</h2>
      <p class="kpi-value">
        {{
          dataGateway.kpiValueFor(configuration().dataSource)()
            | currency: 'USD' : 'symbol' : '1.0-0'
        }}
      </p>
      <p class="widget-caption">Current month</p>
    </article>
  `,
  styleUrl: './widget-card.scss',
})
export class KpiWidgetComponent {
  readonly configuration = input.required<KpiWidgetConfiguration>();
  protected readonly dataGateway = inject(WidgetDataGateway);
}
