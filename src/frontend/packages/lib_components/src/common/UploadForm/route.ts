import { modelName } from '@lib-components/types/models';
import { UploadableObject } from '@lib-components/types/tracks';

/**
 * Route for the `<UploadForm />` component.
 * @param objectType The model name for the object for which we're uploading a file.
 * @param objectId The ID of said object.
 */
export const UPLOAD_FORM_ROUTE = (
  objectType?: modelName,
  objectId?: UploadableObject['id'],
) => {
  if (objectType) {
    return `/form/${objectType}/${objectId || ''}`;
  } else {
    return `/form/:objectType(${Object.values(modelName).join('|')})/:objectId`;
  }
};
