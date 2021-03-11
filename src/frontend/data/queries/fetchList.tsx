import { QueryFunction } from 'react-query';

import { appData } from '../appData';

/**
 * `react-query` fetcher for lists of items from the Marsha API.
 */
export const fetchList: QueryFunction<any> = async ({ queryKey }) => {
  const [name, queryParams] = queryKey;

  const response = await fetch(
    `/api/${name}/?${new URLSearchParams({
      ...queryParams,
      limit: '999',
    }).toString()}`,
    {
      headers: {
        'Content-Type': 'application/json',
        ...(appData.jwt ? { Authorization: `Bearer ${appData.jwt}` } : {}),
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to get list of ${name}.`);
  }

  return await response.json();
};
