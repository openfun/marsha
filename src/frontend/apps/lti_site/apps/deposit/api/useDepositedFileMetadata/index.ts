import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import { metadata } from 'lib-components';

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
  >({
    queryKey: key,
    queryFn: metadata,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    cacheTime: Infinity,
    staleTime: Infinity,
    ...queryConfig,
  });
};
