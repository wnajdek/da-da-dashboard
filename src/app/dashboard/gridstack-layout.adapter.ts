import { GridStackNode, GridStackWidget } from 'gridstack';
import { WidgetInstance, WidgetLayoutChange } from './dashboard.models';

type GridStackLayoutNode = Pick<GridStackNode, 'id' | 'x' | 'y' | 'w' | 'h'>;

export class GridStackLayoutAdapter {
  static toGridStackWidget(
    widget: Pick<WidgetInstance, 'id' | 'layout'>,
  ): GridStackWidget {
    return { id: widget.id, ...widget.layout };
  }

  static toLayoutChange(node: GridStackLayoutNode): WidgetLayoutChange | null {
    if (
      typeof node.id !== 'string' ||
      !isGridDimension(node.x) ||
      !isGridDimension(node.y) ||
      !isGridDimension(node.w) ||
      !isGridDimension(node.h)
    ) {
      return null;
    }

    return {
      id: node.id,
      layout: { x: node.x, y: node.y, w: node.w, h: node.h },
    };
  }
}

function isGridDimension(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
