import { MutationFunction } from 'react-query';

import { useJwt } from 'data/stores/useJwt';

/**
 * `react-query` call action on individual item from the Marsha API.
 */
export const actionOne: MutationFunction<
  any,
  { name: string; id: string; action: string; method?: string; object?: any }
> = async ({ name, id, action, method, object }) => {
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
  const response = await fetch(`/api/${name}/${id}/${action}/`, init);

  if (!response.ok) {
    if (response.status === 400) {
      throw { code: 'invalid', ...(await response.json()) };
    }

    throw { code: 'exception' };
  }

  return await response.json();
};
