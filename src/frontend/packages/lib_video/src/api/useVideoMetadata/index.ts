import { FetchResponseError, metadata } from 'lib-components';
import { useQuery, UseQueryOptions } from 'react-query';

import { VideoMetadata } from 'types/metadata';

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
  >(key, metadata, {
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    cacheTime: Infinity,
    staleTime: Infinity,
    ...queryConfig,
  });
};
