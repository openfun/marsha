import { useJwt } from 'hooks/stores/useJwt';

import { fetchResponseHandler } from './fetchResponseHandler';
import { fetchWrapper } from './fetchWrapper';

interface Variables<K> {
  name: string;
  object: K;
}

export const createOne = async <T, K>({
  name,
  object,
}: Variables<K>): Promise<T> => {
  const jwt = useJwt.getState().jwt;
  const response = await fetchWrapper(`/api/${name}/`, {
    headers: {
      'Content-Type': 'application/json',
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    method: 'POST',
    body: JSON.stringify(object),
  });

  return await fetchResponseHandler(response);
};
