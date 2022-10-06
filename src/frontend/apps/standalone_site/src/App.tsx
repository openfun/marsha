import { Grommet, Main, Page } from 'grommet';
import { useEffect, useState } from 'react';
import { IntlProvider } from 'react-intl';
import { BrowserRouter } from 'react-router-dom';

import { DEFAULT_LANGUAGE } from 'conf/global';
import { Authenticator } from 'features/Authentication';
import { AppRoutes } from 'routes';
import { themeExtend } from 'styles/theme.extend';
import { getCurrentTranslation, getLanguage } from 'utils/lang';

import './App.css';

const App = () => {
  const [currentTranslation, setCurrentTranslation] =
    useState<Record<string, string>>();

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
      <Grommet theme={themeExtend}>
        <BrowserRouter>
          <Authenticator>
            <Main>
              <Page kind="full">
                <AppRoutes />
              </Page>
            </Main>
          </Authenticator>
        </BrowserRouter>
      </Grommet>
    </IntlProvider>
  );
};

export default App;
