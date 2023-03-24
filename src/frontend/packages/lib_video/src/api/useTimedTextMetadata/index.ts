import { metadata } from 'lib-components';
import { useQuery, UseQueryOptions } from 'react-query';

import { TimedTextMetadata } from '@lib-video/types/metadata';

export const useTimedTextMetadata = (
  locale: string,
  queryConfig?: UseQueryOptions<
    TimedTextMetadata,
    'timedtexttracks',
    TimedTextMetadata,
    string[]
  >,
) => {
  const key = ['timedtexttracks', locale];
  return useQuery<
    TimedTextMetadata,
    'timedtexttracks',
    TimedTextMetadata,
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
