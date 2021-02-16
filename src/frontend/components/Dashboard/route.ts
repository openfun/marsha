import { ModelName } from '../../types/models';

/**
 * Route for the `<Dashboard />` component.
 * @param objectType The model name for the object for which we're uploading a file.
 */
export const DASHBOARD_ROUTE = (objectType?: ModelName) => {
  if (objectType) {
    return `/dashboard/${objectType}`;
  }

  return `/dashboard/:objectType(${ModelName.VIDEOS}|${ModelName.DOCUMENTS})`;
};
