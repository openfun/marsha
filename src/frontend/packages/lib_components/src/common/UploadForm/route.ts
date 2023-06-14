import { UploadableObject } from '@lib-components/types';
import { modelName } from '@lib-components/types/models';

/**
 * Route for the `<UploadForm />` component.
 * @param objectType The model name for the object for which we're uploading a file.
 * @param objectId The ID of said object.
 */

export const UPLOAD_FORM_ROUTE = {
  base: 'form',
  all: `form/*`,
  objectType: ':objectType',
  objectId: ':objectId',
  ...modelName,
};

export const builderUploadFormRoute = (
  objectType: modelName,
  objectId?: UploadableObject['id'],
) => {
  return `/${UPLOAD_FORM_ROUTE.base}/${objectType}/${objectId || ''}`;
};
