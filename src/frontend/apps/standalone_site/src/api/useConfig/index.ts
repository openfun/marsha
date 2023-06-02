import {
  FetchListQueryKey,
  FetchResponseError,
  fetchResponseHandler,
  fetchWrapper,
} from 'lib-components';
import { useQuery, UseQueryOptions } from 'react-query';

export interface ConfigResponse {
  sentry_dsn: string | null;
  environment: string;
  release: string;
  inactive_content_types: string[];
}

export const getConfig = async () => {
  const response = await fetchWrapper(
    `/api/config/?domain=${window.location.host}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  return await fetchResponseHandler<ConfigResponse>(response, {
    errorMessage: `Failed to get the configs.`,
  });
};

export function useConfig(
  queryConfig?: UseQueryOptions<
    ConfigResponse,
    FetchResponseError<ConfigResponse>,
    ConfigResponse
  >,
) {
  const keys: FetchListQueryKey = ['config'];
  return useQuery<
    ConfigResponse,
    FetchResponseError<ConfigResponse>,
    ConfigResponse
  >(keys, getConfig, queryConfig);
}
