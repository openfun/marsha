import {
  APIList,
  FetchListQueryKey,
  Organization,
  fetchList,
} from 'lib-components';
import { UseQueryOptions, useQuery } from 'react-query';

type OrganizationsResponse = APIList<Organization>;
type UseOrganizationsParams = {
  limit: string;
  offset: string;
};

export const useOrganizations = (
  params: UseOrganizationsParams,
  queryConfig?: UseQueryOptions<
    OrganizationsResponse,
    'organizations',
    OrganizationsResponse,
    FetchListQueryKey
  >,
) => {
  const keys: FetchListQueryKey = ['organizations', params];
  return useQuery<
    OrganizationsResponse,
    'organizations',
    OrganizationsResponse,
    FetchListQueryKey
  >(keys, fetchList, queryConfig);
};
