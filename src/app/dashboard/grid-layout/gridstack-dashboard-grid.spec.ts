import { GridItemHTMLElement, GridStack } from 'gridstack';
import type { WidgetInstance } from '../workspace/dashboard.models';
import { GridStackDashboardGrid } from './gridstack-dashboard-grid';

describe('GridStackDashboardGrid', () => {
  const widget: WidgetInstance = {
    id: 'f09f1c23-2b6d-4f2d-9ca5-8b7be4a5dd11',
    type: 'weather',
    layout: { x: 1, y: 2, w: 3, h: 4 },
    configuration: {},
  };

  let element: HTMLElement;
  let dashboardGrid: GridStackDashboardGrid;

  beforeEach(() => {
    element = document.createElement('section');
    element.classList.add('grid-stack');
    document.body.append(element);
    dashboardGrid = new GridStackDashboardGrid();
    dashboardGrid.initialize(element, () => undefined);
  });

  afterEach(() => {
    dashboardGrid.destroy();
    element.remove();
  });

  it('synchronizes added, updated, and removed Widget Instances without exposing GridStack objects', () => {
    const removeWidget = spyOn(
      GridStack.prototype,
      'removeWidget',
    ).and.callThrough();
    const item = document.createElement('section') as GridItemHTMLElement;
    item.classList.add('grid-stack-item');
    item.setAttribute('gs-id', widget.id);
    element.append(item);

    dashboardGrid.synchronize([widget]);

    expect(item.gridstackNode).toEqual(
      jasmine.objectContaining({ id: widget.id, x: 1, w: 3, h: 4 }),
    );

    dashboardGrid.synchronize([
      { ...widget, layout: { x: 4, y: 5, w: 6, h: 7 } },
    ]);

    expect(item.gridstackNode).toEqual(
      jasmine.objectContaining({ id: widget.id, x: 4, w: 6, h: 7 }),
    );

    dashboardGrid.synchronize([]);

    expect(removeWidget).toHaveBeenCalledWith(item, false);
  });

  it('enables and disables GridStack only through the narrow-screen interface', () => {
    const disable = spyOn(GridStack.prototype, 'disable').and.callThrough();
    const enable = spyOn(GridStack.prototype, 'enable').and.callThrough();

    dashboardGrid.setNarrowScreen(true);
    dashboardGrid.setNarrowScreen(false);

    expect(disable).toHaveBeenCalledTimes(1);
    expect(enable).toHaveBeenCalledTimes(1);
  });
});
