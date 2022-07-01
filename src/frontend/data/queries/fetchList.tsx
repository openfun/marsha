import { QueryFunction } from 'react-query';
import { Maybe } from 'utils/types';

import { appData } from '../appData';

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

  // remove keys with undefined value
  Object.keys(queryParams).forEach(
    (key) => queryParams[key] === undefined && delete queryParams[key],
  );

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
