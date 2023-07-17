import { FetchResponseError, metadata } from 'lib-components';
import { UseQueryOptions, useQuery } from 'react-query';

import { ThumbnailMetadata } from '@lib-video/types/metadata';

type UseThumbnailMetadataError = FetchResponseError<ThumbnailMetadata>;
export const useThumbnailMetadata = (
  videoId: string,
  locale: string,
  queryConfig?: UseQueryOptions<
    ThumbnailMetadata,
    UseThumbnailMetadataError,
    ThumbnailMetadata,
    string[]
  >,
) => {
  const key = [`videos/${videoId}/thumbnails`, locale];
  return useQuery<
    ThumbnailMetadata,
    UseThumbnailMetadataError,
    ThumbnailMetadata,
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
