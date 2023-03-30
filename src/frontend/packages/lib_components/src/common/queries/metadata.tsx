import { QueryKey, QueryFunctionContext } from 'react-query';

import { useJwt } from '@lib-components/hooks/stores/useJwt';

import { fetchResponseHandler } from './fetchResponseHandler';
import { fetchWrapper } from './fetchWrapper';

/**
 * `react-query` fetcher for individual metadata model.
 */
export const metadata = async <T,>({
  queryKey,
}: QueryFunctionContext<QueryKey>): Promise<T> => {
  const jwt = useJwt.getState().getJwt();
  const [name, locale] = queryKey;
  const response = await fetchWrapper(`/api/${String(name)}/`, {
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': String(locale),
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    method: 'OPTIONS',
  });

  return await fetchResponseHandler(response, {
    errorMessage: `Failed to get metadata for /${String(name)}/.`,
  });
};
