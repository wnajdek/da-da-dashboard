export const DASHBOARD_GRID_CONFIG = {
  columns: 12,
  layoutConstraints: {
    minimumWidth: 1,
    minimumHeight: 1,
    maximumWidth: 12,
  },
  narrowScreenBreakpoint: 767,
  cellHeight: 96,
  margin: 8,
  dragHandleSelector: '.widget-drag-handle',
} as const;
