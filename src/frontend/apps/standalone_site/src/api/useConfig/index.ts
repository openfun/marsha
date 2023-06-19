import {
  FetchListQueryKey,
  FetchResponseError,
  fetchResponseHandler,
  fetchWrapper,
} from 'lib-components';
import { useQuery, UseQueryOptions } from 'react-query';

export interface ConfigResponse {
  p2p: {
    live_enabled: boolean;
    live_web_torrent_tracker_urls: string[];
    live_stun_server_urls: string[];
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
