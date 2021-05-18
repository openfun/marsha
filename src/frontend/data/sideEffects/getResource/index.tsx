import { requestStatus } from '../../../types/api';
import { API_ENDPOINT } from '../../../settings';
import { modelName } from '../../../types/models';
import { appData } from '../../appData';
import { addResource } from '../../stores/generics';
import { report } from '../../../utils/errors/report';

/**
 * Fetch a resource to update its state in our store.
 * @param resourceName The model name for the resource .
 * @param resourceId The resource id to fetch
 * @returns a promise for a request status, so the side effect caller can simply wait for it if needed.
 */
export async function getResource(
  resourceName: modelName,
  resourceId: string,
): Promise<requestStatus> {
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

    await addResource(resourceName, await response.json());
    return requestStatus.SUCCESS;
  } catch (error) {
    report(error);
    return requestStatus.FAILURE;
  }
}
