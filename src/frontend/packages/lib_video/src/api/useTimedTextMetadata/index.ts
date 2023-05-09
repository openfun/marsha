import { FetchResponseError, metadata } from 'lib-components';
import { useQuery, UseQueryOptions } from 'react-query';

import { TimedTextMetadata } from '@lib-video/types/metadata';

type UseTimedTextMetadataError = FetchResponseError<TimedTextMetadata>;
export const useTimedTextMetadata = (
  videoId: string,
  locale: string,
  queryConfig?: UseQueryOptions<
    TimedTextMetadata,
    UseTimedTextMetadataError,
    TimedTextMetadata,
    string[]
  >,
) => {
  const key = [`videos/${videoId}/timedtexttracks`, locale];
  return useQuery<
    TimedTextMetadata,
    UseTimedTextMetadataError,
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
