import { QueryKey, QueryFunctionContext } from 'react-query';

import { useJwt } from 'hooks/stores/useJwt';

import { fetchWrapper } from './fetchWrapper';

/**
 * `react-query` fetcher for individual metadata model.
 */
export const metadata = async <T,>({
  queryKey,
}: QueryFunctionContext<QueryKey>): Promise<T> => {
  const jwt = useJwt.getState().jwt;
  const [name, locale] = queryKey;
  const response = await fetchWrapper(`/api/${String(name)}/`, {
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': String(locale),
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    method: 'OPTIONS',
  });

  if (!response.ok) {
    throw new Error(`Failed to get metadata for /${String(name)}/.`);
  }

  return (await response.json()) as T;
};
