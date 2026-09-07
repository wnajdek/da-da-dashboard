import { GridStackNode, GridStackWidget } from 'gridstack';
import {
  isValidGridLayout,
  WidgetInstance,
  WidgetLayoutChange,
} from '../workspace/dashboard.models';

type GridStackLayoutNode = Pick<GridStackNode, 'id' | 'x' | 'y' | 'w' | 'h'>;

export class GridStackLayoutAdapter {
  static toGridStackWidget(
    widget: Pick<WidgetInstance, 'id' | 'layout'>,
  ): GridStackWidget {
    return { id: widget.id, ...widget.layout };
  }

  static toLayoutChange(node: GridStackLayoutNode): WidgetLayoutChange | null {
    const layout = { x: node.x, y: node.y, w: node.w, h: node.h };

    if (typeof node.id !== 'string' || !isValidGridLayout(layout)) {
      return null;
    }

    return {
      id: node.id,
      layout,
    };
  }
}
