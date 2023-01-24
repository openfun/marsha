import { Grommet } from 'grommet';
import { colors } from 'lib-common';
import { useEffect, useMemo, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { BrowserRouter } from 'react-router-dom';

import { ContentSpinner } from 'components/Spinner';
import { DEFAULT_LANGUAGE } from 'conf/global';
import { AppRoutes } from 'routes';
import { getFullThemeExtend } from 'styles/theme.extend';
import { getCurrentTranslation, getLanguage, getLocaleCode } from 'utils/lang';

import './App.css';

const themeExtended = getFullThemeExtend();

const App = () => {
  const [isAppInitialized, setIsAppInitialized] = useState(false);
  const [currentTranslation, setCurrentTranslation] =
    useState<Record<string, string>>();
  const queryClient = useMemo(() => new QueryClient(), []);
  const [language, setLanguage] = useState<string>();
  const [localCode, setLocalCode] = useState<string>();
  const [isDomReady, setIsDomReady] = useState(false);

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

  //  call this effect last to configure all stores first
  useEffect(() => {
    setIsAppInitialized(true);
  }, [setIsAppInitialized]);

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

  if (!isAppInitialized) {
    return null;
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
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools />
        <Grommet theme={themeExtended}>
          <Toaster
            toastOptions={{
              duration: 5000,
              success: {
                style: {
                  background: colors['status-ok'],
                },
              },
              error: {
                style: {
                  color: colors['white'],
                  background: colors['accent-2'],
                },
              },
            }}
          />
          <BrowserRouter>
            {isDomReady ? (
              <AppRoutes />
            ) : (
              <ContentSpinner boxProps={{ height: '100vh' }} />
            )}
          </BrowserRouter>
        </Grommet>
      </QueryClientProvider>
    </IntlProvider>
  );
};

export default App;
