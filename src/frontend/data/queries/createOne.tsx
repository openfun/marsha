import { MutationFunction } from 'react-query';

import { appData } from '../appData';

export const createOne: MutationFunction<any, { name: string; object: any }> =
  async ({ name, object }) => {
    const response = await fetch(`/api/${name}/`, {
      headers: {
        'Content-Type': 'application/json',
        ...(appData.jwt ? { Authorization: `Bearer ${appData.jwt}` } : {}),
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
