import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import { FetchResponseError, fetchOne } from 'lib-components';

export interface PageResponse {
  slug: string;
  name: string;
  content: string;
}
export const usePageApi = (
  slug: string,
  queryConfig?: UseQueryOptions<
    PageResponse,
    FetchResponseError<PageResponse>,
    PageResponse
  >,
) => {
  const key = ['pages', slug];
  return useQuery<PageResponse, FetchResponseError<PageResponse>, PageResponse>(
    { queryKey: key, queryFn: fetchOne, ...queryConfig },
  );
};
