import { useSentry } from 'lib-components';
import { Fragment, PropsWithChildren, useEffect } from 'react';

import { useConfig } from 'api/useConfig';
import { ContentSpinner } from 'components/Spinner';
import { featureContentLoader, useContentFeatures } from 'features/Contents';

const AppConfig = ({ children }: PropsWithChildren<unknown>) => {
  const setSentry = useSentry((state) => state.setSentry);
  const { data: config } = useConfig({
    keepPreviousData: true,
    staleTime: Infinity,
  });
  const isFeatureLoaded = useContentFeatures((state) => state.isFeatureLoaded);

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

    featureContentLoader(config.inactive_resources);
  }, [setSentry, config]);

  if (!isFeatureLoaded) {
    return <ContentSpinner boxProps={{ height: '100vh' }} />;
  }

  return <Fragment>{children}</Fragment>;
};

export default AppConfig;
