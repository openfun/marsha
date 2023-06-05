import { useSentry } from 'lib-components';
import { PropsWithChildren, useEffect, useState } from 'react';
import { IntlProvider } from 'react-intl';

import { useConfig } from 'api/useConfig';
import { ContentSpinner } from 'components/Spinner';
import { DEFAULT_LANGUAGE } from 'conf/global';
import { featureContentLoader, useContentFeatures } from 'features/Contents';
import { getCurrentTranslation, getLanguage, getLocaleCode } from 'utils/lang';

const AppConfig = ({ children }: PropsWithChildren<unknown>) => {
  const [currentTranslation, setCurrentTranslation] =
    useState<Record<string, string>>();
  const [language, setLanguage] = useState<string>();
  const [localCode, setLocalCode] = useState<string>();
  const [isDomReady, setIsDomReady] = useState(false);
  const setSentry = useSentry((state) => state.setSentry);
  const { data: config } = useConfig({
    keepPreviousData: true,
    staleTime: Infinity,
  });
  const isFeatureLoaded = useContentFeatures((state) => state.isFeatureLoaded);
  const isConfigReady = isFeatureLoaded && isDomReady;

  useEffect(() => {
    const language = getLanguage();
    setLanguage(language);
    setLocalCode(getLocaleCode(language));
  }, []);

  /**
   * Load the current language and translation
   */
  useEffect(() => {
    if (language) {
      getCurrentTranslation(language).then((translation) => {
        setCurrentTranslation(translation);
      });
    }
  }, [language]);

  useEffect(() => {
    const handleCDNLoaded = () => {
      setIsDomReady(window.isCDNLoaded || false);
    };

    document.addEventListener('CDNLoaded', handleCDNLoaded);
    handleCDNLoaded();
    return () => {
      document.removeEventListener('CDNLoaded', handleCDNLoaded);
    };
  }, []);

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

  if (!isConfigReady) {
    return <ContentSpinner boxProps={{ height: '100vh' }} />;
  }

  return (
    <IntlProvider
      messages={currentTranslation}
      locale={localCode || ''}
      defaultLocale={getLocaleCode(DEFAULT_LANGUAGE)}
      onError={(err) => {
        // https://github.com/formatjs/formatjs/issues/465
        if (err.code === 'MISSING_TRANSLATION') {
          return;
        }
        throw err;
      }}
    >
      {children}
    </IntlProvider>
  );
};

export default AppConfig;
