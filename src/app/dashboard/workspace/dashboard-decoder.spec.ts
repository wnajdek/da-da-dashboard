import {
  decodeDashboardSnapshot,
  decodeGridLayout,
  decodeGridLayoutSize,
  decodeWidgetType,
} from './dashboard-decoder';

const DASHBOARD_ID = 'e25b6b77-2b4e-4d7e-91df-51feded26e83';
const WIDGET_ID = 'f09f1c23-2b6d-4f2d-9ca5-8b7be4a5dd11';

describe('Dashboard domain decoding', () => {
  it('accepts an unavailable Widget Type in an otherwise valid Dashboard Snapshot', () => {
    const snapshot = {
      schemaVersion: 1 as const,
      dashboard: {
        id: DASHBOARD_ID,
        title: 'Saved dashboard',
        widgets: [
          {
            id: WIDGET_ID,
            type: 'removed-widget',
            layout: { x: 8, y: 3, w: 4, h: 2 },
            configuration: { location: 'Warsaw' },
          },
        ],
      },
    };

    expect(decodeDashboardSnapshot(snapshot)).toEqual(snapshot);
  });

  it('uses the stable Widget Type invariant for persisted and command input', () => {
    expect(decodeWidgetType('weather.forecast-v2')).toBe('weather.forecast-v2');
    expect(decodeWidgetType('Weather')).toBeNull();
    expect(decodeWidgetType('weather widget')).toBeNull();
    expect(decodeWidgetType('')).toBeNull();
  });

  it('accepts only whole Grid Layouts that fit the twelve-column grid', () => {
    expect(decodeGridLayout({ x: 8, y: 3, w: 4, h: 2 })).toEqual({
      x: 8,
      y: 3,
      w: 4,
      h: 2,
    });
    expect(decodeGridLayout({ x: 8.5, y: 3, w: 3, h: 2 })).toBeNull();
    expect(decodeGridLayout({ x: 9, y: 3, w: 4, h: 2 })).toBeNull();
    expect(decodeGridLayout({ x: 0, y: 0, w: 0, h: 2 })).toBeNull();
    expect(decodeGridLayoutSize({ w: 13, h: 2 })).toBeNull();
  });

  it('rejects Dashboard Snapshots with invalid dashboard identity, title, or Widget Instances', () => {
    const validWidget = {
      id: WIDGET_ID,
      type: 'weather',
      layout: { x: 0, y: 0, w: 4, h: 3 },
      configuration: { location: 'Warsaw' },
    };

    for (const dashboard of [
      { id: 'not-a-uuid', title: 'Saved dashboard', widgets: [] },
      { id: DASHBOARD_ID, title: '   ', widgets: [] },
      {
        id: DASHBOARD_ID,
        title: 'Saved dashboard',
        widgets: [validWidget, validWidget],
      },
      {
        id: DASHBOARD_ID,
        title: 'Saved dashboard',
        widgets: [{ ...validWidget, configuration: { invalid: new Date() } }],
      },
    ]) {
      expect(
        decodeDashboardSnapshot({ schemaVersion: 1, dashboard }),
      ).toBeNull();
    }
  });
});
