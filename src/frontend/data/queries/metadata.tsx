import { QueryFunction } from 'react-query';

import { useJwt } from 'data/stores/useJwt';

/**
 * `react-query` fetcher for individual metadata model.
 */
export const metadata: QueryFunction<any> = async ({ queryKey }) => {
  const jwt = useJwt.getState().jwt;
  const [name] = queryKey;
  const response = await fetch(`/api/${name}/`, {
    headers: {
      'Content-Type': 'application/json',
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    method: 'OPTIONS',
  });

  if (!response.ok) {
    throw new Error(`Failed to get metadata for /${name}/.`);
  }

  return await response.json();
};
