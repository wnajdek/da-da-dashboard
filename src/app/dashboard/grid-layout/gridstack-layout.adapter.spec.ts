import {
  toGridStackWidget,
  toWidgetLayoutChange,
} from './gridstack-layout.adapter';

describe('GridStack layout conversions', () => {
  const WIDGET_ID = 'f09f1c23-2b6d-4f2d-9ca5-8b7be4a5dd11';

  it('converts a Widget Instance portable Grid Layout to GridStack input', () => {
    expect(
      toGridStackWidget({
        id: WIDGET_ID,
        layout: { x: 2, y: 3, w: 4, h: 5 },
      }),
    ).toEqual({
      id: WIDGET_ID,
      x: 2,
      y: 3,
      w: 4,
      h: 5,
      minW: 1,
      minH: 1,
      maxW: 12,
    });
  });

  it('converts final GridStack output into a portable Grid Layout change', () => {
    expect(
      toWidgetLayoutChange({
        id: WIDGET_ID,
        x: 2,
        y: 3,
        w: 4,
        h: 5,
      }),
    ).toEqual({
      id: WIDGET_ID,
      layout: { x: 2, y: 3, w: 4, h: 5 },
    });
  });

  it('ignores incomplete GridStack nodes so they cannot enter Dashboard state', () => {
    expect(toWidgetLayoutChange({ id: WIDGET_ID, x: 2, y: 3 })).toBeNull();
  });
});
