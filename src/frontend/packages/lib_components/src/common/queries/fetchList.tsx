import { QueryFunctionContext } from '@tanstack/react-query';
import { Maybe } from 'lib-common';

import { useJwt } from '@lib-components/hooks/stores/useJwt';

import { fetchResponseHandler } from './fetchResponseHandler';
import { fetchWrapper } from './fetchWrapper';

export type FetchListQueryKey =
  | [string, Maybe<{ [key in string]: Maybe<string> }>]
  | [string];

/**
 * `react-query` fetcher for lists of items from the Marsha API.
 */
export const fetchList = async <T,>({
  queryKey,
}: QueryFunctionContext<FetchListQueryKey>): Promise<T> => {
  const name = queryKey[0];
  const queryParams = queryKey[1] || {};

  const jwt = useJwt.getState().getJwt();

  // remove keys with undefined value
  Object.keys(queryParams).forEach(
    (key) => queryParams[key] === undefined && delete queryParams[key],
  );

  const response = await fetchWrapper(
    `/api/${name}/?${new URLSearchParams({
      limit: '999',
      ...queryParams,
    }).toString()}`,
    {
      headers: {
        'Content-Type': 'application/json',
        ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
      },
    },
  );

  return await fetchResponseHandler(response, {
    errorMessage: `Failed to get list of ${name}.`,
  });
};
