import { modelName } from '@lib-components/types/models';

/**
 * Route for the `<Dashboard />` component.
 * @param objectType The model name for the object for which we're uploading a file.
 */
export const DASHBOARD_ROUTE = (objectType?: modelName) => {
  if (objectType) {
    return `/dashboard/${objectType}`;
  }

  return `/dashboard/:objectType(${modelName.VIDEOS}|${modelName.DOCUMENTS})`;
};
