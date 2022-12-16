import {
  APIList,
  fetchList,
  FetchListQueryKey,
  LiveAttendance,
} from 'lib-components';
import { useQuery, UseQueryOptions } from 'react-query';

export type LiveAttendancesResponse = APIList<LiveAttendance>;
export const useLiveAttendances = (
  queryConfig?: UseQueryOptions<
    LiveAttendancesResponse,
    'livesessions/list_attendances',
    LiveAttendancesResponse,
    FetchListQueryKey
  >,
) => {
  const key: FetchListQueryKey = ['livesessions/list_attendances'];
  return useQuery<
    LiveAttendancesResponse,
    'livesessions/list_attendances',
    LiveAttendancesResponse,
    FetchListQueryKey
  >(key, fetchList, queryConfig);
};
