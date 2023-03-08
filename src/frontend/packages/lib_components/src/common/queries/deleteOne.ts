import { useJwt } from 'hooks/stores/useJwt';

import { fetchResponseHandler } from './fetchResponseHandler';
import { fetchWrapper } from './fetchWrapper';

export const deleteOne = async ({
  name,
  id,
}: {
  name: string;
  id: string;
}): Promise<undefined> => {
  const jwt = useJwt.getState().getJwt();
  const response = await fetchWrapper(`/api/${name}/${id}/`, {
    headers: {
      'Content-Type': 'application/json',
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    method: 'DELETE',
  });

  await fetchResponseHandler(response, {
    withoutBody: true,
  });

  return undefined;
};
