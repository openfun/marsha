import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import { FetchResponseError, metadata } from 'lib-components';

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
