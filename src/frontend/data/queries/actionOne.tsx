import { MutationFunction } from 'react-query';
import { appData } from 'data/appData';

/**
 * `react-query` call action on individual item from the Marsha API.
 */
export const actionOne: MutationFunction<
  any,
  { name: string; id: string; action: string; object: any }
> = async ({ name, id, action, object }) => {
  const response = await fetch(`/api/${name}/${id}/${action}/`, {
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
