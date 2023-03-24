import { metadata, modelName } from 'lib-components';
import { useQuery, UseQueryOptions } from 'react-query';

import { TimedTextMetadata } from '@lib-video/types';

export const useFetchTimedTextTrackLanguageChoices = (
  queryConfig?: UseQueryOptions<
    TimedTextMetadata,
    'timedtexttracks',
    TimedTextMetadata,
    string[]
  >,
) => {
  return useQuery<
    TimedTextMetadata,
    'timedtexttracks',
    TimedTextMetadata,
    string[]
  >([modelName.TIMEDTEXTTRACKS], metadata, {
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    cacheTime: Infinity,
    staleTime: Infinity,
    ...queryConfig,
  });
};
