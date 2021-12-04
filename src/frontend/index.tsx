import 'iframe-resizer/js/iframeResizer.contentWindow';

import * as Sentry from '@sentry/browser';
import { Grommet } from 'grommet';
import React from 'react';
import ReactDOM from 'react-dom';
import {
  createIntl,
  createIntlCache,
  IntlShape,
  RawIntlProvider,
} from 'react-intl';

import { appData, getDecodedJwt } from './data/appData';
import { flags } from './types/AppData';
import { report } from './utils/errors/report';
import { isFeatureEnabled } from './utils/isFeatureEnabled';

// Load our style reboot into the DOM
import { GlobalStyles } from './utils/theme/baseStyles';
import { theme } from './utils/theme/theme';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

if (isFeatureEnabled(flags.SENTRY) && appData.sentry_dsn) {
  Sentry.init({
    dsn: appData.sentry_dsn,
    environment: appData.environment,
    release: appData.release,
  });
  Sentry.configureScope((scope) => scope.setExtra('application', 'frontend'));
}

let localeCode: string;
let locale: string;
try {
  locale = localeCode = getDecodedJwt().locale;
  if (localeCode.match(/^.*_.*$/)) {
    localeCode = localeCode.split('_')[0];
  }
} catch (e) {
  localeCode = 'en';
  locale = 'en_US';
}

export let intl: IntlShape;

// Wait for the DOM to load before we scour it for an element that requires React to render
document.addEventListener('DOMContentLoaded', async () => {
  try {
    if (!window.Intl) {
      await import('intl');
      await import(`intl/locale-data/jsonp/${localeCode}.js`);
    }

    if (!Intl.PluralRules) {
      await import('intl-pluralrules');
    }
    // TODO: remove type assertion when typescript libs include RelativeTimeFormat
    if (!(Intl as any).RelativeTimeFormat) {
      await import('@formatjs/intl-relativetimeformat');
      // Get `react-intl`/`formatjs` lang specific parameters and data
      await import(
        `@formatjs/intl-relativetimeformat/locale-data/${localeCode}`
      );
    }
  } catch (e) {
    report(e);
  }

  let translatedMessages = null;
  try {
    translatedMessages = await import(`./translations/${locale}.json`);
  } catch (e) {}

  const cache = createIntlCache();
  intl = createIntl(
    {
      locale: localeCode,
      messages: translatedMessages,
    },
    cache,
  );

  let App: () => JSX.Element;
  if (appData.appName) {
    try {
      App = await import(`./apps/${appData.appName}/Routes`);
    } catch (e) {
      throw new Error(
        `${appData.appName} is not an expected value for appData.appName (${e})`,
      );
    }
  } else {
    try {
      App = await import(`./components/${appData.frontend}Routes`);
    } catch (e) {
      throw new Error(
        `${appData.frontend} is not an expected value for appData.frontend (${e})`,
      );
    }
  }

  const queryClient = new QueryClient();

  // Render our actual component tree
  ReactDOM.render(
    <RawIntlProvider value={intl}>
      <QueryClientProvider client={queryClient}>
        <Grommet theme={theme} style={{ height: '100%' }}>
          <Toaster
            toastOptions={{
              duration: 5000,
              success: {
                style: {
                  background: theme.global.colors['status-ok'],
                },
              },
              error: {
                style: {
                  color: theme.global.colors.white,
                  background: theme.global.colors['accent-2'],
                },
              },
            }}
          />
          <App />
          <GlobalStyles />
        </Grommet>
      </QueryClientProvider>
    </RawIntlProvider>,
    document.querySelector('#marsha-frontend-root'),
  );
});
