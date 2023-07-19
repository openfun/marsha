import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import {
  APIList,
  FetchListQueryKey,
  FetchResponseError,
  fetchList,
} from 'lib-components';

export interface UserLite {
  email: string;
  full_name: string;
  id: string;
}

type SearchUsersResponse = APIList<UserLite>;
type UseSearchUsersParams = {
  fullname_or_email__icontains?: string;
  first_name__icontains?: string;
  last_name__icontains?: string;
  email__icontains?: string;
  full_name__icontains?: string;
  id_not_in?: string;
};

export const useSearchUsers = (
  params: UseSearchUsersParams,
  queryConfig?: UseQueryOptions<
    SearchUsersResponse,
    FetchResponseError<SearchUsersResponse>,
    SearchUsersResponse,
    FetchListQueryKey
  >,
) => {
  const keys: FetchListQueryKey = ['users', params];
  return useQuery<
    SearchUsersResponse,
    FetchResponseError<SearchUsersResponse>,
    SearchUsersResponse,
    FetchListQueryKey
  >({ queryKey: keys, queryFn: fetchList, ...queryConfig });
};
