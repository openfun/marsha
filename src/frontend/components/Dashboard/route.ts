import { modelName } from 'types/models';

/**
 * Route for the `<Dashboard />` component.
 * @param objectType The model name for the object for which we're uploading a file.
 */
export const DASHBOARD_ROUTE = (
  objectType: modelName.VIDEOS | modelName.DOCUMENTS,
) => {
  return `/dashboard/${objectType}`;
};
