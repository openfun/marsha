import { metadata } from 'lib-components';
import { UseQueryOptions, useQuery } from 'react-query';

import { DepositedFileMetadata } from 'apps/deposit/types/metadata';

export const useDepositedFileMetadata = (
  locale: string,
  queryConfig?: UseQueryOptions<
    DepositedFileMetadata,
    'depositedfiles',
    DepositedFileMetadata,
    string[]
  >,
) => {
  const key = ['depositedfiles', locale];
  return useQuery<
    DepositedFileMetadata,
    'depositedfiles',
    DepositedFileMetadata,
    string[]
  >(key, metadata, {
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    cacheTime: Infinity,
    staleTime: Infinity,
    ...queryConfig,
  });
};
