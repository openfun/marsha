import { Grommet } from 'grommet';
import React, {
  ComponentType,
  lazy,
  LazyExoticComponent,
  Suspense,
  useMemo,
} from 'react';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';
import { createIntlCache, createIntl, RawIntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';

import { BoundaryScreenError } from 'components/ErrorComponents';
import { Loader } from 'lib-components';
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

const appsContent: Record<string, LazyExoticComponent<ComponentType<any>>> = {
  LTI: lazy(() => import('components/LTIRoutes')),
  Site: lazy(() => import('components/SiteRoutes')),
};
Object.values(appNames).forEach((app) => {
  appsContent[app] = lazy(() => import(`apps/${app}/components/Routes`));
});

const AppContentLoader = () => {
  const appConfig = useAppConfig();
  const queryClient = useMemo(() => new QueryClient(), []);

  let Content: LazyExoticComponent<ComponentType<any>>;
  if (appConfig.appName) Content = appsContent[appConfig.appName];
  else if (appConfig.frontend) Content = appsContent[appConfig.frontend];
  else throw new Error('application and frontend are not properly set');

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools />
      <RawIntlProvider value={intl}>
        <Grommet theme={theme} style={{ height: '100%' }}>
          <ErrorBoundary
            fallbackRender={({ error }) => (
              <BoundaryScreenError code={500} message={error.message} />
            )}
          >
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
          </ErrorBoundary>
        </Grommet>
      </RawIntlProvider>
    </QueryClientProvider>
  );
};

export default AppContentLoader;
