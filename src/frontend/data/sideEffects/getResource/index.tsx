import { appData } from 'data/appData';
import { addResource } from 'data/stores/generics';
import { requestStatus } from 'types/api';
import { modelName } from 'types/models';
import { UploadableObject } from 'types/tracks';
import { report } from 'utils/errors/report';
import { API_ENDPOINT } from 'settings';

/**
 * Fetch a resource to update its state in our store.
 * @param resourceName The model name for the resource .
 * @param resourceId The resource id to fetch
 * @returns a promise for a request status, so the side effect caller can simply wait for it if needed.
 */
export async function getResource(
  resourceName: modelName,
  resourceId: string,
): Promise<UploadableObject | requestStatus.FAILURE> {
  const endpoint = `${API_ENDPOINT}/${resourceName}/${resourceId}/`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${appData.jwt}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch resource ${resourceName} with id ${resourceId}`,
      );
    }
    const resource = await response.json();
    await addResource(resourceName, resource);
    return resource;
  } catch (error) {
    report(error);
    return requestStatus.FAILURE;
  }
}
