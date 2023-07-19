import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import {
  APIList,
  FetchListQueryKey,
  FetchResponseError,
  fetchResponseHandler,
} from 'lib-components';

export interface PagesApi {
  slug: string;
  name: string;
}

type PagesApiResponse = APIList<PagesApi>;

export const getPages = async () => {
  const response = await fetch(`/api/pages/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const pages = await fetchResponseHandler<PagesApiResponse>(response, {
    errorMessage: `Failed to get list of pages.`,
  });
  return pages;
};

export function usePagesApi(
  queryConfig?: UseQueryOptions<
    PagesApiResponse,
    FetchResponseError<PagesApiResponse>,
    PagesApiResponse,
    FetchListQueryKey
  >,
) {
  const keys: FetchListQueryKey = ['pages'];
  return useQuery<
    PagesApiResponse,
    FetchResponseError<PagesApiResponse>,
    PagesApiResponse,
    FetchListQueryKey
  >({ queryKey: keys, queryFn: getPages, ...queryConfig });
}
