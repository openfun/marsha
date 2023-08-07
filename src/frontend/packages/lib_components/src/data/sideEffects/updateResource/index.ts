import { Maybe } from '@lib-common/types';

import { fetchWrapper } from '@lib-components/common/queries/fetchWrapper';
import { useJwt } from '@lib-components/hooks/stores';
import { API_ENDPOINT } from '@lib-components/settings';
import {
  getParentType,
  uploadableModelName,
} from '@lib-components/types/models';
import { Resource } from '@lib-components/types/tracks';

export async function updateResource<R extends Resource>(
  resource: R,
  resourceName: uploadableModelName,
  parentId?: Maybe<string>,
): Promise<R> {
  let endpoint = `${API_ENDPOINT}/${resourceName}/${resource.id}/`;
  const parentType = getParentType(resourceName);
  if (parentId && parentType) {
    endpoint = `${API_ENDPOINT}/${parentType}/${parentId}/${resourceName}/${resource.id}/`;
  }

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
