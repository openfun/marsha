import { metadata } from 'lib-components';
import { useQuery, UseQueryOptions } from 'react-query';

import { ThumbnailMetadata } from 'types/metadata';

export const useThumbnailMetadata = (
  locale: string,
  queryConfig?: UseQueryOptions<
    ThumbnailMetadata,
    'thumbnails',
    ThumbnailMetadata,
    string[]
  >,
) => {
  const key = ['thumbnails', locale];
  return useQuery<ThumbnailMetadata, 'thumbnails', ThumbnailMetadata, string[]>(
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
