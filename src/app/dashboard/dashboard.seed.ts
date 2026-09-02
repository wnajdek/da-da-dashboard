import { Dashboard } from './dashboard.models';

export function createSeedDashboard(): Dashboard {
  return {
    id: 'e25b6b77-2b4e-4d7e-91df-51feded26e83',
    title: 'My dashboard',
    widgets: [],
  };
}
