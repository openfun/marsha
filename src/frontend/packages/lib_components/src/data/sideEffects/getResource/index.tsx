/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { API_ENDPOINT } from 'settings';

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
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${useJwt.getState().jwt}`,
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
