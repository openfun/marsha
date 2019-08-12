import 'iframe-resizer/js/iframeResizer.contentWindow';

import { Grommet } from 'grommet';
import jwtDecode from 'jwt-decode';
import React from 'react';
import ReactDOM from 'react-dom';
import {
  createIntl,
  createIntlCache,
  IntlShape,
  RawIntlProvider,
} from 'react-intl';

import { AppRoutes } from './components/AppRoutes';
import { appData } from './data/appData';
import { DecodedJwt } from './types/jwt';
import { report } from './utils/errors/report';
// Load our style reboot into the DOM
import { GlobalStyles } from './utils/theme/baseStyles';
import { theme } from './utils/theme/theme';

const decodedToken: DecodedJwt = jwtDecode(appData.jwt);

let localeCode = decodedToken.locale;
if (localeCode.match(/^.*_.*$/)) {
  localeCode = localeCode.split('_')[0];
}

export let intl: IntlShape;

// Wait for the DOM to load before we scour it for an element that requires React to render
document.addEventListener('DOMContentLoaded', async event => {
  try {
    if (!Intl.PluralRules) {
      await import('intl-pluralrules');
    }

    if (!Intl.RelativeTimeFormat) {
      await import('@formatjs/intl-relativetimeformat');
      // Get `react-intl`/`formatjs` lang specific parameters and data
      await import(
        `@formatjs/intl-relativetimeformat/dist/locale-data/${localeCode}`
      );
    }
  } catch (e) {
    report(e);
  }

  let translatedMessages = null;
  try {
    translatedMessages = await import(
      `./translations/${decodedToken.locale}.json`
    );
  } catch (e) {}

  const cache = createIntlCache();
  intl = createIntl(
    {
      locale: localeCode,
      messages: translatedMessages,
    },
    cache,
  );

  // Render our actual component tree
  ReactDOM.render(
    <RawIntlProvider value={intl}>
      <Grommet theme={theme}>
        <AppRoutes />
        <GlobalStyles />
      </Grommet>
    </RawIntlProvider>,
    document.querySelector('#marsha-frontend-root'),
  );
});
