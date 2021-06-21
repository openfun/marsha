import { MutationFunction } from 'react-query';

import { appData } from '../appData';

export const updateOne: MutationFunction<
  any,
  { name: string; id: string; object: any }
> = async ({ name, id, object }) => {
  const response = await fetch(`/api/${name}/${id}/`, {
    headers: {
      'Content-Type': 'application/json',
      ...(appData.jwt ? { Authorization: `Bearer ${appData.jwt}` } : {}),
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
