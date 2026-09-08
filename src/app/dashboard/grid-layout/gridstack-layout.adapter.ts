import { GridStackNode, GridStackWidget } from 'gridstack';
import { DASHBOARD_GRID_CONFIG } from './dashboard-grid.config';
import { decodeWidgetLayoutChange } from '../workspace/dashboard-decoder';
import type {
  WidgetInstance,
  WidgetLayoutChange,
} from '../workspace/dashboard.models';

type GridStackLayoutNode = Pick<GridStackNode, 'id' | 'x' | 'y' | 'w' | 'h'>;

export function toGridStackWidget(
  widget: Pick<WidgetInstance, 'id' | 'layout'>,
): GridStackWidget {
  return {
    id: widget.id,
    ...widget.layout,
    minW: DASHBOARD_GRID_CONFIG.layoutConstraints.minimumWidth,
    minH: DASHBOARD_GRID_CONFIG.layoutConstraints.minimumHeight,
    maxW: DASHBOARD_GRID_CONFIG.layoutConstraints.maximumWidth,
  };
}

export function toWidgetLayoutChange(
  node: GridStackLayoutNode,
): WidgetLayoutChange | null {
  return decodeWidgetLayoutChange({
    id: node.id,
    layout: { x: node.x, y: node.y, w: node.w, h: node.h },
  });
}
