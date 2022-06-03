import { MutationFunction } from 'react-query';

import { appData } from 'data/appData';

export const deleteOne: MutationFunction<
  any,
  { name: string; id: string }
> = async ({ name, id }) => {
  const response = await fetch(`/api/${name}/${id}/`, {
    headers: {
      'Content-Type': 'application/json',
      ...(appData.jwt ? { Authorization: `Bearer ${appData.jwt}` } : {}),
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
