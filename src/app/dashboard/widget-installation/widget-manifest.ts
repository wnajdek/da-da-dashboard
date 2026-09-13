import {
  type WidgetManifestValidationResult,
  validateWidgetManifest,
} from '@da-da/widget-contract';
import { DASHBOARD_GRID_COLUMNS } from '../workspace/dashboard-decoder';

export function validateDashboardWidgetManifest(
  value: unknown,
  manifestUrl: string | URL,
): WidgetManifestValidationResult {
  const result = validateWidgetManifest(value, manifestUrl);

  return result.status === 'valid' &&
    result.manifest.preferredLayout.w > DASHBOARD_GRID_COLUMNS
    ? { status: 'invalid', reason: 'invalid' }
    : result;
}
