import { GridStackLayoutAdapter } from './gridstack-layout.adapter';

describe('GridStackLayoutAdapter', () => {
  it('converts a Widget Instance portable Grid Layout to GridStack input', () => {
    expect(
      GridStackLayoutAdapter.toGridStackWidget({
        id: 'widget-1',
        layout: { x: 2, y: 3, w: 4, h: 5 },
      }),
    ).toEqual({ id: 'widget-1', x: 2, y: 3, w: 4, h: 5 });
  });

  it('converts final GridStack output into a portable Grid Layout change', () => {
    expect(
      GridStackLayoutAdapter.toLayoutChange({
        id: 'widget-1',
        x: 2,
        y: 3,
        w: 4,
        h: 5,
      }),
    ).toEqual({
      id: 'widget-1',
      layout: { x: 2, y: 3, w: 4, h: 5 },
    });
  });

  it('ignores incomplete GridStack nodes so they cannot enter Dashboard state', () => {
    expect(
      GridStackLayoutAdapter.toLayoutChange({ id: 'widget-1', x: 2, y: 3 }),
    ).toBeNull();
  });
});
