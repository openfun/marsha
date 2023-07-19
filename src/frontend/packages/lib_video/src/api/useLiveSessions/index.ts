import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import {
  APIList,
  FetchListQueryKey,
  LiveSession,
  fetchList,
} from 'lib-components';

type LiveSessionsResponse = APIList<LiveSession>;
type UseLiveSessionsParams = { anonymous_id?: string };
export const useLiveSessionsQuery = (
  videoId: string,
  params: UseLiveSessionsParams,
  queryConfig?: UseQueryOptions<
    LiveSessionsResponse,
    'livesessions',
    LiveSessionsResponse,
    FetchListQueryKey
  >,
) => {
  const key: FetchListQueryKey = [`videos/${videoId}/livesessions`, params];
  return useQuery<
    LiveSessionsResponse,
    'livesessions',
    LiveSessionsResponse,
    FetchListQueryKey
  >({ queryKey: key, queryFn: fetchList, ...queryConfig });
};
