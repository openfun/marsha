import { useJwt } from 'hooks/stores/useJwt';

import { fetchResponseHandler } from './fetchResponseHandler';
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

  return await fetchResponseHandler(
    await fetchWrapper(`/api/${name}/${id}/${action}/`, init),
  );
};
