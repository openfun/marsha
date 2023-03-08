import { API_ENDPOINT } from 'settings';

import { fetchWrapper } from 'common/queries/fetchWrapper';
import { useJwt } from 'hooks/stores';
import { uploadableModelName } from 'types/models';
import { Resource } from 'types/tracks';

export async function updateResource<R extends Resource>(
  resource: R,
  resourceName: uploadableModelName,
): Promise<R> {
  const endpoint = `${API_ENDPOINT}/${resourceName}/${resource.id}/`;

  const response = await fetchWrapper(endpoint, {
    body: JSON.stringify(resource),
    headers: {
      Authorization: `Bearer ${useJwt.getState().getJwt() ?? ''}`,
      'Content-Type': 'application/json',
    },
    method: 'PUT',
  });

  if (!response.ok) {
    throw new Error(
      `Failed to update resource ${resourceName} with id ${resource.id}`,
    );
  }

  return (await response.json()) as R;
}
