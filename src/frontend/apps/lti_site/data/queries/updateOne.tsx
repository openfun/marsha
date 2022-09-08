import { MutationFunction } from '@tanstack/react-query';

import { useJwt } from 'data/stores/useJwt';

export const updateOne: MutationFunction<
  any,
  { name: string; id: string; object: any }
> = async ({ name, id, object }) => {
  const jwt = useJwt.getState().jwt;
  const response = await fetch(`/api/${name}/${id}/`, {
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

  return await response.json();
};
