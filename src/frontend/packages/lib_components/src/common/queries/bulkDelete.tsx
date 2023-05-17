import { useJwt } from '@lib-components/hooks/stores/useJwt';

import { fetchResponseHandler } from './fetchResponseHandler';
import { fetchWrapper } from './fetchWrapper';

export const bulkDelete = async ({
  name,
  objects,
}: {
  name: string;
  objects: { ids: string[] };
}) => {
  const jwt = useJwt.getState().getJwt();
  const response = await fetchWrapper(`/api/${name}/`, {
    headers: {
      'Content-Type': 'application/json',
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    method: 'DELETE',
    body: JSON.stringify(objects),
  });

  await fetchResponseHandler(response, { withoutBody: true });
};
