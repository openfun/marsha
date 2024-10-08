import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import {
  FetchListQueryKey,
  FetchResponseError,
  SiteConfig,
  fetchResponseHandler,
  fetchWrapper,
} from 'lib-components';

export interface ConfigResponse extends SiteConfig {
  p2p: {
    isEnabled: boolean;
    webTorrentTrackerUrls: string[];
    stunServerUrls: string[];
  };
  sentry_dsn: string | null;
  environment: string;
  release: string;
  inactive_resources: string[];
  flags: Partial<Record<string, boolean>>;
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
  >({ queryKey: keys, queryFn: getConfig, ...queryConfig });
}
