import { Grommet, Main, Page } from 'grommet';
import { useEffect, useMemo, useState } from 'react';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { BrowserRouter } from 'react-router-dom';

import { DEFAULT_LANGUAGE } from 'conf/global';
import { Authenticator } from 'features/Authentication';
import { AppRoutes } from 'routes';
import { getFullThemeExtend } from 'styles/theme.extend';
import { getCurrentTranslation, getLanguage } from 'utils/lang';

import './App.css';

const themeExtended = getFullThemeExtend();

const App = () => {
  const [currentTranslation, setCurrentTranslation] =
    useState<Record<string, string>>();
  const queryClient = useMemo(() => new QueryClient(), []);

  /**
   * Load the current language and translation
   */
  useEffect(() => {
    getCurrentTranslation(getLanguage()).then((translation) => {
      setCurrentTranslation(translation);
    });
  }, []);

  return (
    <IntlProvider
      messages={currentTranslation}
      locale={getLanguage()}
      defaultLocale={DEFAULT_LANGUAGE}
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
          <BrowserRouter>
            <Authenticator>
              <Main height={{ min: '100vh' }}>
                <Page kind="full">
                  <AppRoutes />
                </Page>
              </Main>
            </Authenticator>
          </BrowserRouter>
        </Grommet>
      </QueryClientProvider>
    </IntlProvider>
  );
};

export default App;
