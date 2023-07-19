import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import { FetchResponseError, metadata } from 'lib-components';

import { TimedTextMetadata } from '@lib-video/types/metadata';

type UseTimedTextMetadataError = FetchResponseError<TimedTextMetadata>;
export const useTimedTextMetadata = (
  videoId: string,
  locale?: string,
  queryConfig?: UseQueryOptions<
    TimedTextMetadata,
    UseTimedTextMetadataError,
    TimedTextMetadata,
    string[]
  >,
) => {
  const key = [`videos/${videoId}/timedtexttracks`, locale || 'undefined'];
  return useQuery<
    TimedTextMetadata,
    UseTimedTextMetadataError,
    TimedTextMetadata,
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
