import { modelName } from '@lib-components/types/models';

/**
 * Route for the `<Dashboard />` component.
 * @param objectType The model name for the object for which we're uploading a file.
 */
export const DASHBOARD_ROUTE = {
  base: 'dashboard',
  all: `dashboard/*`,
  default: '/dashboard/:objectType',
  pathKey: ':objectType',
};

export const builderDashboardRoute = (
  objectType?: modelName.VIDEOS | modelName.DOCUMENTS,
) => {
  return `/${DASHBOARD_ROUTE.base}/${objectType || ''}`;
};
