import { fetchOne, metadata, Video } from 'lib-components';
import { useQuery, UseQueryOptions } from 'react-query';

import { VideoMetadata } from 'types/metadata';

export const useVideo = (
  videoId: string,
  queryConfig?: UseQueryOptions<Video, 'videos', Video>,
) => {
  const key = ['videos', videoId];
  return useQuery<Video, 'videos'>(key, fetchOne, queryConfig);
};

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
