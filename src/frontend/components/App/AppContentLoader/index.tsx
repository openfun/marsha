import { Grommet } from 'grommet';
import React, {
  ComponentType,
  lazy,
  LazyExoticComponent,
  Suspense,
  useMemo,
} from 'react';
import { Toaster } from 'react-hot-toast';
import { createIntlCache, createIntl, RawIntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';

import { Loader } from 'components/Loader';
import { useAppConfig } from 'data/stores/useAppConfig';
import { useJwt } from 'data/stores/useJwt';
import { appNames } from 'types/AppData';
import { report } from 'utils/errors/report';
import { GlobalStyles } from 'utils/theme/baseStyles';
import { colors, theme } from 'utils/theme/theme';

import { decodeJwt } from './utils';

const jwt = useJwt.getState().jwt;

let localeCode: string;
let locale: string;
try {
  locale = localeCode = decodeJwt(jwt).locale;
  if (localeCode.match(/^.*_.*$/)) {
    localeCode = localeCode.split('_')[0];
  }
} catch (e) {
  localeCode = 'en';
  locale = 'en_US';
}

try {
  if (!window.Intl) {
    /* tslint:disable no-var-requires */
    require('intl');
    /* tslint:disable no-var-requires */
    require(`intl/locale-data/jsonp/${localeCode}.js`);
  }

  if (!Intl.PluralRules) {
    /* tslint:disable no-var-requires */
    require('intl-pluralrules');
  }
  if (!Intl.RelativeTimeFormat) {
    /* tslint:disable no-var-requires */
    require('@formatjs/intl-relativetimeformat');
    // Get `react-intl`/`formatjs` lang specific parameters and data
    /* tslint:disable no-var-requires */
    require(`@formatjs/intl-relativetimeformat/locale-data/${localeCode}`);
  }
} catch (e) {
  report(e);
}

let translatedMessages = null;
try {
  /* tslint:disable no-var-requires */
  translatedMessages = require(`translations/${locale}.json`);
} catch (e) {}

const cache = createIntlCache();
const intl = createIntl(
  {
    locale: localeCode,
    messages: translatedMessages,
  },
  cache,
);

const appsContent: Record<string, LazyExoticComponent<ComponentType<any>>> = {};
Object.values(appNames).forEach((app) => {
  appsContent[app] = lazy(() => import(`apps/${app}/components/Routes`));
});
const ltiSite = lazy(() => import('components/LTIRoutes'));

const AppContentLoader = () => {
  const appConfig = useAppConfig();
  const queryClient = useMemo(() => new QueryClient(), []);

  const Content = appConfig.appName ? appsContent[appConfig.appName] : ltiSite;

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools />
      <RawIntlProvider value={intl}>
        <Grommet theme={theme} style={{ height: '100%' }}>
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
                  color: colors.white,
                  background: colors['accent-2'],
                },
              },
            }}
          />
          <Suspense fallback={<Loader />}>
            <Content />
          </Suspense>
          <GlobalStyles />
        </Grommet>
      </RawIntlProvider>
    </QueryClientProvider>
  );
};

export default AppContentLoader;
