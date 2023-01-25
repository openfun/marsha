import { QueryKey, QueryFunctionContext } from 'react-query';

import { useJwt } from 'hooks/stores/useJwt';

import { fetchWrapper } from './fetchWrapper';

/**
 * `react-query` fetcher for individual items from the Marsha API.
 */
export const fetchOne = async <T,>({
  queryKey,
}: QueryFunctionContext<QueryKey>): Promise<T> => {
  const jwt = useJwt.getState().jwt;
  const [name, id, action] = queryKey;

  const actionEndpoint = action ? `${String(action)}/` : '';
  const endpoint = `/api/${String(name)}/${String(id)}/${actionEndpoint}`;

  const response = await fetchWrapper(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get ${endpoint}.`);
  }

  return (await response.json()) as T;
};
