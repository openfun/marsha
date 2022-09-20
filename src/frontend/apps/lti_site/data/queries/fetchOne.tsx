import { useJwt } from 'lib-components';
import { QueryFunction } from 'react-query';

/**
 * `react-query` fetcher for individual items from the Marsha API.
 */
export const fetchOne: QueryFunction<any> = async ({ queryKey }) => {
  const jwt = useJwt.getState().jwt;
  const [name, id, action] = queryKey;
  const endpoint = action ? `${action}/` : '';
  const response = await fetch(`/api/${name}/${id}/${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get /${name}/${id}/${endpoint}.`);
  }

  return await response.json();
};
