import { v4 as uuidv4 } from 'uuid';

import { fetchWrapper } from '@lib-components/common/queries/fetchWrapper';
import { XAPI_ENDPOINT } from '@lib-components/settings';
import { Resource } from '@lib-components/types';
import { DataPayload, XapiResourceType } from '@lib-components/types/XAPI';

export const sendXAPIStatement = (
  data: DataPayload,
  jwt: string,
  resourceType: XapiResourceType,
  resourceId: Resource['id'],
) => {
  void fetchWrapper(`${XAPI_ENDPOINT}/${resourceType}/${resourceId}/`, {
    body: JSON.stringify({
      ...data,
      id: uuidv4(),
    }),
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
};
