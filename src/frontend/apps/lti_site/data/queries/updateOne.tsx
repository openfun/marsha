import { useJwt } from 'lib-components';
import { MutationFunction } from 'react-query';

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
