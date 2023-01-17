import { fetchOne, metadata, TimedText } from 'lib-components';
import { useQuery, UseQueryOptions } from 'react-query';

import { TimedTextMetadata } from 'types/metadata';

export const useTimedText = (
  trackId: string,
  queryConfig?: UseQueryOptions<TimedText, 'timed_text_tracks', TimedText>,
) => {
  const key = ['timed_text_tracks', trackId];
  return useQuery<TimedText, 'timed_text_tracks'>(key, fetchOne, queryConfig);
};

export const useTimedTextMetadata = (
  locale: string,
  queryConfig?: UseQueryOptions<
    TimedTextMetadata,
    'timed_text_tracks',
    TimedTextMetadata,
    string[]
  >,
) => {
  const key = ['timed_text_tracks', locale];
  return useQuery<
    TimedTextMetadata,
    'timed_text_tracks',
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
