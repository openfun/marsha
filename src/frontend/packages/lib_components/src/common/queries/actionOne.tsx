import { useJwt } from 'hooks/stores/useJwt';

import { fetchWrapper } from './fetchWrapper';

/**
 * `react-query` call action on individual item from the Marsha API.
 */
interface Variables<K> {
  name: string;
  id: string;
  action: string;
  method?: string;
  object?: K;
}

export const actionOne = async <T, K>({
  name,
  id,
  action,
  method,
  object,
}: Variables<K>): Promise<T> => {
  const jwt = useJwt.getState().jwt;
  const init: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    method: method || 'PATCH',
  };
  if (object) {
    init.body = JSON.stringify(object);
  }
  const response = await fetchWrapper(`/api/${name}/${id}/${action}/`, init);

  if (!response.ok) {
    if (response.status === 400) {
      throw { code: 'invalid', ...(await response.json()) };
    }

    throw { code: 'exception' };
  }

  return (await response.json()) as T;
};
