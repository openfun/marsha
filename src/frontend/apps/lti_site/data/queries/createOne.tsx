import { MutationFunction } from 'react-query';

import { useJwt } from 'data/stores/useJwt';

export const createOne: MutationFunction<
  any,
  { name: string; object: any }
> = async ({ name, object }) => {
  const jwt = useJwt.getState().jwt;
  const response = await fetch(`/api/${name}/`, {
    headers: {
      'Content-Type': 'application/json',
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    method: 'POST',
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
