import {
  APIList,
  FetchListQueryKey,
  LiveSession,
  fetchList,
} from 'lib-components';
import { UseQueryOptions, useQuery } from 'react-query';

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
  >(key, fetchList, queryConfig);
};
