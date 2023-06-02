import { useSentry } from 'lib-components';
import { useEffect } from 'react';

import { useConfig } from 'api/useConfig';

export const SentryLoader = () => {
  const setSentry = useSentry((state) => state.setSentry);
  const { data: config } = useConfig({
    keepPreviousData: true,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!config) {
      return;
    }

    if (config.sentry_dsn) {
      setSentry(
        config.sentry_dsn,
        config.environment,
        config.release,
        'standalone',
      );
    }
  }, [setSentry, config]);

  return null;
};
