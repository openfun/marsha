import { FetchResponseError, fetchOne } from 'lib-components';
import { UseQueryOptions, useQuery } from 'react-query';

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
    key,
    fetchOne,
    queryConfig,
  );
};
