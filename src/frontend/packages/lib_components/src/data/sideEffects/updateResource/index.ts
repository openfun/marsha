/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { API_ENDPOINT } from 'settings';

import { useJwt } from 'hooks/stores';
import { uploadableModelName } from 'types/models';
import { Resource } from 'types/tracks';

export async function updateResource<R extends Resource>(
  resource: R,
  resourceName: uploadableModelName,
): Promise<R> {
  const endpoint = `${API_ENDPOINT}/${resourceName}/${resource.id}/`;

  const response = await fetch(endpoint, {
    body: JSON.stringify(resource),
    headers: {
      Authorization: `Bearer ${useJwt.getState().jwt}`,
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
