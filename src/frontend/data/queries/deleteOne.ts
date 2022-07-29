import { MutationFunction } from 'react-query';

import { useJwt } from 'data/stores/useJwt';

export const deleteOne: MutationFunction<
  any,
  { name: string; id: string }
> = async ({ name, id }) => {
  const jwt = useJwt.getState().jwt;
  const response = await fetch(`/api/${name}/${id}/`, {
    headers: {
      'Content-Type': 'application/json',
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    method: 'DELETE',
  });

  if (!response.ok) {
    if (response.status === 400) {
      throw { code: 'invalid', ...(await response.json()) };
    }

    throw { code: 'exception' };
  }
};
