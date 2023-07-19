import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import { FetchResponseError, metadata } from 'lib-components';

import { VideoMetadata } from '@lib-video/types/metadata';

export const useVideoMetadata = (
  locale: string,
  queryConfig?: UseQueryOptions<
    VideoMetadata,
    FetchResponseError<VideoMetadata>,
    VideoMetadata,
    string[]
  >,
) => {
  const key = ['videos', locale];
  return useQuery<
    VideoMetadata,
    FetchResponseError<VideoMetadata>,
    VideoMetadata,
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
