import { Component, computed, inject, input } from '@angular/core';
import { EChartsCoreOption } from 'echarts/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { DemoDataService } from './demo-data.service';
import { TimeSeriesWidgetInstance, WidgetContext } from './dashboard.models';
import { echarts } from './echarts.config';

@Component({
  selector: 'app-time-series-widget',
  imports: [NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  template: `
    <article class="widget-card">
      <p class="widget-kind">Time series</p>
      <h2>{{ context().widget.configuration.title }}</h2>
      <div
        echarts
        class="time-series-chart"
        data-testid="time-series-chart"
        role="img"
        [attr.aria-label]="chartSummary()"
        [options]="chartOptions()"
      ></div>
    </article>
  `,
  styleUrl: './widget-card.scss',
})
export class TimeSeriesWidgetComponent {
  readonly context = input.required<WidgetContext<TimeSeriesWidgetInstance>>();
  protected readonly demoData = inject(DemoDataService);
  protected readonly chartOptions = computed<EChartsCoreOption>(() => {
    const values = this.values();

    return {
      animation: true,
      grid: { top: 16, right: 16, bottom: 24, left: 48 },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['Jan', 'Feb', 'Mar', 'Apr'],
      },
      yAxis: { type: 'value' },
      series: [
        {
          type: 'line',
          data: values,
          smooth: true,
          lineStyle: { color: '#0b8a9b', width: 3 },
          itemStyle: { color: '#0b8a9b' },
        },
      ],
    };
  });

  protected values(): readonly number[] {
    return this.demoData.timeSeriesValuesFor(
      this.context().widget.configuration.dataSource,
    );
  }

  protected chartSummary(): string {
    return `${this.context().widget.configuration.title} chart, January to April: ${this.values()
      .map((value) => `$${value / 1000}k`)
      .join(', ')}`;
  }
}
