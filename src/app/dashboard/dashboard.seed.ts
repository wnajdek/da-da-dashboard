import { Dashboard } from './dashboard.models';

export function createSeedDashboard(): Dashboard {
  return {
    id: 'e25b6b77-2b4e-4d7e-91df-51feded26e83',
    title: 'My dashboard',
    widgets: [
      {
        id: 'af25bb8c-0db6-47fd-9c31-c8e6c1ebbb5f',
        type: 'kpi',
        layout: { x: 0, y: 0, w: 3, h: 2 },
        configuration: {
          title: 'Monthly revenue',
          dataSource: 'monthly-revenue',
          displayFormat: 'currency',
        },
      },
      {
        id: '33514934-7fbf-4c2b-a15c-b0d38c6c7a92',
        type: 'time-series',
        layout: { x: 3, y: 0, w: 6, h: 3 },
        configuration: {
          title: 'Revenue trend',
          dataSource: 'monthly-revenue-trend',
        },
      },
      {
        id: 'ea79d695-84db-431a-87a5-73d1a371344c',
        type: 'notes',
        layout: { x: 9, y: 0, w: 3, h: 3 },
        configuration: {
          title: 'Team notes',
          body: 'Review monthly progress with the team on Friday.',
        },
      },
    ],
  };
}
