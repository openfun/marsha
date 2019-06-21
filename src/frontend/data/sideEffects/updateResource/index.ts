import { API_ENDPOINT } from '../../../settings';
import { modelName } from '../../../types/models';
import { Resource } from '../../../types/tracks';
import { appData } from '../../appData';

export async function updateResource<R extends Resource>(
  resource: R,
  resourceName: modelName,
): Promise<R> {
  const endpoint = `${API_ENDPOINT}/${resourceName}/${resource.id}/`;

  const response = await fetch(endpoint, {
    body: JSON.stringify(resource),
    headers: {
      Authorization: `Bearer ${appData.jwt}`,
      'Content-Type': 'application/json',
    },
    method: 'PUT',
  });

  if (!response.ok) {
    throw new Error(
      `Failed to update resource ${resourceName} with id ${resource.id}`,
    );
  }

  return await response.json();
}
