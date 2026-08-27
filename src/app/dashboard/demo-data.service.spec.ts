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
});
