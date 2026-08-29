import { TestBed } from '@angular/core/testing';
import { DemoDataService } from './demo-data.service';

describe('DemoDataService', () => {
  it('resolves the seeded values from their data source keys', () => {
    const service = TestBed.inject(DemoDataService);

    expect(service.kpiValueFor('monthly-revenue')).toBe(124500);
    expect(service.timeSeriesValuesFor('monthly-revenue-trend')).toEqual([
      94000, 101000, 109000, 117000,
    ]);
  });

  it('advances each Data Source predictably when refreshed', () => {
    const service = TestBed.inject(DemoDataService);

    service.refresh();

    expect(service.kpiValueFor('monthly-revenue')).toBe(127000);
    expect(service.timeSeriesValuesFor('monthly-revenue-trend')).toEqual([
      96000, 103000, 111000, 119000,
    ]);

    service.refresh();

    expect(service.kpiValueFor('monthly-revenue')).toBe(129500);
    expect(service.timeSeriesValuesFor('monthly-revenue-trend')).toEqual([
      98000, 105000, 113000, 121000,
    ]);
  });
});
