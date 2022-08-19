import { QueryFunction } from 'react-query';

import { useJwt } from 'data/stores/useJwt';
import { Maybe } from 'utils/types';

export type FetchListQueryKey =
  | [string, Maybe<{ [key in string]: Maybe<string> }>]
  | [string];

/**
 * `react-query` fetcher for lists of items from the Marsha API.
 */
export const fetchList: QueryFunction<any, FetchListQueryKey> = async ({
  queryKey,
}) => {
  const name = queryKey[0];
  const queryParams = queryKey[1] || {};

  const jwt = useJwt.getState().jwt;

  // remove keys with undefined value
  Object.keys(queryParams).forEach(
    (key) => queryParams[key] === undefined && delete queryParams[key],
  );

  const response = await fetch(
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

  if (!response.ok) {
    throw new Error(`Failed to get list of ${name}.`);
  }

  return await response.json();
};
