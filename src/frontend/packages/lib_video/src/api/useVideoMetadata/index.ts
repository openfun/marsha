import { metadata } from 'lib-components';
import { useQuery, UseQueryOptions } from 'react-query';

import { VideoMetadata } from 'types/metadata';

export const useVideoMetadata = (
  locale: string,
  queryConfig?: UseQueryOptions<
    VideoMetadata,
    'videos',
    VideoMetadata,
    string[]
  >,
) => {
  const key = ['videos', locale];
  return useQuery<VideoMetadata, 'videos', VideoMetadata, string[]>(
    key,
    metadata,
    {
      refetchInterval: false,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
      cacheTime: Infinity,
      staleTime: Infinity,
      ...queryConfig,
    },
  );
};
