import { CurrencyPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { DemoDataService } from './demo-data.service';
import { KpiWidgetInstance, WidgetContext } from './dashboard.models';

@Component({
  selector: 'app-kpi-widget',
  imports: [CurrencyPipe],
  template: `
    <article class="widget-card">
      <p class="widget-kind">KPI</p>
      <h2>{{ context().widget.configuration.title }}</h2>
      <p class="kpi-value">
        {{
          demoData.kpiValueFor(context().widget.configuration.dataSource)
            | currency: 'USD' : 'symbol' : '1.0-0'
        }}
      </p>
      <p class="widget-caption">Current month</p>
    </article>
  `,
  styleUrl: './widget-card.scss',
})
export class KpiWidgetComponent {
  readonly context = input.required<WidgetContext<KpiWidgetInstance>>();
  protected readonly demoData = inject(DemoDataService);
}
