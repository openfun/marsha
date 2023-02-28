import { XAPI_ENDPOINT } from 'settings';
import { Resource } from 'types';
import { v4 as uuidv4 } from 'uuid';

import { fetchWrapper } from 'common/queries/fetchWrapper';
import { DataPayload, XapiResourceType } from 'types/XAPI';

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
