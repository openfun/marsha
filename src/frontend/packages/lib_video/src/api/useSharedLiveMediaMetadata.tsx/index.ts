import { fetchOne, metadata, SharedLiveMedia } from 'lib-components';
import { useQuery, UseQueryOptions } from 'react-query';

import { SharedLiveMediaMetadata } from 'types/metadata';

export const useSharedLiveMedia = (
  sharedLiveMediaId: string,
  queryConfig?: UseQueryOptions<
    SharedLiveMedia,
    'sharedlivemedias',
    SharedLiveMedia
  >,
) => {
  const key = ['sharedlivemedias', sharedLiveMediaId];
  return useQuery<SharedLiveMedia, 'sharedlivemedias'>(
    key,
    fetchOne,
    queryConfig,
  );
};

export const useSharedLiveMediaMetadata = (
  locale: string,
  queryConfig?: UseQueryOptions<
    SharedLiveMediaMetadata,
    'sharedlivemedias',
    SharedLiveMediaMetadata,
    string[]
  >,
) => {
  const key = ['sharedlivemedias', locale];
  return useQuery<
    SharedLiveMediaMetadata,
    'sharedlivemedias',
    SharedLiveMediaMetadata,
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
