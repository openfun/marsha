import { API_ENDPOINT } from 'settings';

import { fetchWrapper } from 'common/queries/fetchWrapper';
import { addResource } from 'data/stores/generics';
import { useJwt } from 'hooks/stores/useJwt';
import { requestStatus } from 'types/api';
import { uploadableModelName } from 'types/models';
import { UploadableObject } from 'types/tracks';
import { report } from 'utils/errors/report';

/**
 * Fetch a resource to update its state in our store.
 * @param resourceName The model name for the resource .
 * @param resourceId The resource id to fetch
 * @returns a promise for a request status, so the side effect caller can simply wait for it if needed.
 */
export async function getResource(
  resourceName: uploadableModelName,
  resourceId: string,
): Promise<UploadableObject | requestStatus.FAILURE> {
  const endpoint = `${API_ENDPOINT}/${resourceName}/${resourceId}/`;

  try {
    const response = await fetchWrapper(endpoint, {
      headers: {
        Authorization: `Bearer ${useJwt.getState().jwt ?? ''}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch resource ${resourceName} with id ${resourceId}`,
      );
    }
    const resource = (await response.json()) as UploadableObject;
    await addResource(resourceName, resource);
    return resource;
  } catch (error) {
    report(error);
    return requestStatus.FAILURE;
  }
}
