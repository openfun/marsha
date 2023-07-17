import {
  FetchListQueryKey,
  FetchResponseError,
  fetchResponseHandler,
  fetchWrapper,
} from 'lib-components';
import { UseQueryOptions, useQuery } from 'react-query';

export interface ConfigResponse {
  p2p: {
    isEnabled: boolean;
    webTorrentTrackerUrls: string[];
    stunServerUrls: string[];
  };
  sentry_dsn: string | null;
  environment: string;
  release: string;
  inactive_resources: string[];
}

export const getConfig = async () => {
  const response = await fetchWrapper(`/api/config/`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

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
