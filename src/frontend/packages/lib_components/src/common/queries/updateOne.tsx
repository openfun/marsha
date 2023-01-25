import { useJwt } from 'hooks/stores/useJwt';

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

  if (!response.ok) {
    if (response.status === 400) {
      throw { code: 'invalid', ...(await response.json()) };
    }

    throw { code: 'exception' };
  }

  return (await response.json()) as T;
};
