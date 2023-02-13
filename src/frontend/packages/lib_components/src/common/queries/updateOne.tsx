import { useJwt } from 'hooks/stores/useJwt';

import { fetchResponseHandler } from './fetchResponseHandler';
import { fetchWrapper } from './fetchWrapper';

interface Variables<K> {
  name: string;
  id: string;
  object?: K;
}

export const updateOne = async <T, K>({
  name,
  id,
  object,
}: Variables<K>): Promise<T> => {
  const jwt = useJwt.getState().jwt;
  const response = await fetchWrapper(`/api/${name}/${id}/`, {
    headers: {
      'Content-Type': 'application/json',
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    method: 'PATCH',
    body: JSON.stringify(object),
  });

  return await fetchResponseHandler(response);
};
