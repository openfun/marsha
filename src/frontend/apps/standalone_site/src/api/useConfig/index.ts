import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import {
  FetchListQueryKey,
  FetchResponseError,
  fetchResponseHandler,
  fetchWrapper,
} from 'lib-components';

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
  vod_conversion_enabled: boolean;
  is_default_site: boolean;
  logo_url?: string;
  is_logo_enabled?: boolean;
  login_html?: string;
  footer_copyright?: string;
  homepage_banner_title?: string;
  homepage_banner_text?: string;
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
