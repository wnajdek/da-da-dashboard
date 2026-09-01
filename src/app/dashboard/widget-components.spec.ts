import {
  provideZonelessChangeDetection,
  Signal,
  Type,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KpiWidgetComponent } from './kpi-widget.component';
import { NotesWidgetComponent } from './notes-widget.component';
import { TimeSeriesWidgetComponent } from './time-series-widget.component';
import {
  KpiWidgetConfiguration,
  NotesWidgetConfiguration,
  TimeSeriesWidgetConfiguration,
} from './dashboard.models';
import { WidgetDataGateway } from './widget-data-gateway';

class TestWidgetDataGateway extends WidgetDataGateway {
  readonly revenue = signal(124500);
  readonly revenueTrend = signal<readonly number[]>([
    94000, 101000, 109000, 117000,
  ]);

  override kpiValueFor(): Signal<number> {
    return this.revenue;
  }

  override timeSeriesValuesFor(): Signal<readonly number[]> {
    return this.revenueTrend;
  }
}

describe('built-in Widgets', () => {
  let dataGateway: TestWidgetDataGateway;

  beforeEach(() => {
    dataGateway = new TestWidgetDataGateway();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: WidgetDataGateway, useValue: dataGateway },
      ],
    });
  });

  it('renders KPI configuration and reacts to gateway data and configuration changes', () => {
    const fixture = createFixture(KpiWidgetComponent);
    fixture.componentRef.setInput('configuration', {
      title: 'Revenue today',
      dataSource: 'monthly-revenue',
      displayFormat: 'currency',
    } satisfies KpiWidgetConfiguration);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Revenue today');
    expect(fixture.nativeElement.textContent).toContain('$124,500');

    dataGateway.revenue.set(127000);
    fixture.componentRef.setInput('configuration', {
      title: 'Updated revenue',
      dataSource: 'monthly-revenue',
      displayFormat: 'currency',
    } satisfies KpiWidgetConfiguration);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Updated revenue');
    expect(fixture.nativeElement.textContent).toContain('$127,000');
  });

  it('renders the Notes configuration without requiring dashboard state', () => {
    const fixture = createFixture(NotesWidgetComponent);
    fixture.componentRef.setInput('configuration', {
      title: 'Friday plan',
      body: 'Review the launch checklist.',
    } satisfies NotesWidgetConfiguration);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Friday plan');
    expect(fixture.nativeElement.textContent).toContain(
      'Review the launch checklist.',
    );
  });

  it('renders refreshed Time-Series values through the gateway', () => {
    const fixture = createFixture(TimeSeriesWidgetComponent);
    fixture.componentRef.setInput('configuration', {
      title: 'Revenue trend',
      dataSource: 'monthly-revenue-trend',
    } satisfies TimeSeriesWidgetConfiguration);
    fixture.detectChanges();

    expect(
      fixture.nativeElement
        .querySelector('[data-testid="time-series-chart"]')
        .getAttribute('aria-label'),
    ).toBe('Revenue trend chart, January to April: $94k, $101k, $109k, $117k');

    dataGateway.revenueTrend.set([96000, 103000, 111000, 119000]);
    fixture.detectChanges();

    expect(
      fixture.nativeElement
        .querySelector('[data-testid="time-series-chart"]')
        .getAttribute('aria-label'),
    ).toBe('Revenue trend chart, January to April: $96k, $103k, $111k, $119k');
  });
});

function createFixture<T>(component: Type<T>): ComponentFixture<T> {
  return TestBed.configureTestingModule({
    imports: [component],
  }).createComponent(component);
}
