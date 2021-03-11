import { QueryFunction } from 'react-query';
import { appData } from '../appData';

/**
 * `react-query` fetcher for individual items from the Marsha API.
 */
export const fetchOne: QueryFunction<any> = async ({ queryKey }) => {
  const [name, id] = queryKey;
  const response = await fetch(`/api/${name}/${id}/`, {
    headers: {
      'Content-Type': 'application/json',
      ...(appData.jwt ? { Authorization: `Bearer ${appData.jwt}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get /${name}/${id}/.`);
  }

  return await response.json();
};
