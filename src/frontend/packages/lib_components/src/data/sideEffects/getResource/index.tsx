import { Maybe } from '@lib-common/types';

import { fetchWrapper } from '@lib-components/common/queries/fetchWrapper';
import { addResource } from '@lib-components/data/stores/generics';
import { useJwt } from '@lib-components/hooks/stores/useJwt';
import { API_ENDPOINT } from '@lib-components/settings';
import { requestStatus } from '@lib-components/types/api';
import {
  getParentType,
  uploadableModelName,
} from '@lib-components/types/models';
import { UploadableObject } from '@lib-components/types/tracks';
import { report } from '@lib-components/utils/errors/report';

/**
 * Fetch a resource to update its state in our store.
 * @param resourceName The model name for the resource .
 * @param resourceId The resource id to fetch
 * @returns a promise for a request status, so the side effect caller can simply wait for it if needed.
 */
export async function getResource(
  resourceName: uploadableModelName,
  resourceId: string,
  parentId?: Maybe<string>,
): Promise<UploadableObject | requestStatus.FAILURE> {
  let endpoint = `${API_ENDPOINT}/${resourceName}/${resourceId}/`;
  const parentType = getParentType(resourceName);
  if (parentId && parentType) {
    endpoint = `${API_ENDPOINT}/${parentType}/${parentId}/${resourceName}/${resourceId}/`;
  }

  try {
    const response = await fetchWrapper(endpoint, {
      headers: {
        Authorization: `Bearer ${useJwt.getState().getJwt() ?? ''}`,
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
