import { GridStackNode, GridStackWidget } from 'gridstack';
import { decodeWidgetLayoutChange } from '../workspace/dashboard-decoder';
import type {
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
    return decodeWidgetLayoutChange({
      id: node.id,
      layout: { x: node.x, y: node.y, w: node.w, h: node.h },
    });
  }
}
