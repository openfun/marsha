import { fetchWrapper, useSentry } from 'lib-components';
import { useEffect } from 'react';

export type FrontendConfiguration = {
  sentry_dsn: string | null;
  environment: string;
  release: string;
};

export const getFrontendConfiguration =
  async (): Promise<FrontendConfiguration> => {
    const response = await fetchWrapper(`/api/config/`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get sentry config : ${response.status}.`);
    }

    return (await response.json()) as FrontendConfiguration;
  };

export const SentryLoader = () => {
  const setSentry = useSentry((state) => state.setSentry);

  useEffect(() => {
    const initSentry = async () => {
      const { environment, release, sentry_dsn } =
        await getFrontendConfiguration();
      if (sentry_dsn) {
        setSentry(sentry_dsn, environment, release, 'standalone');
      }
    };
    initSentry();
  }, [setSentry]);

  return null;
};
