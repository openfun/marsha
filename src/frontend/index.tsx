import 'iframe-resizer/js/iframeResizer.contentWindow';

import { Grommet } from 'grommet';
import jwtDecode from 'jwt-decode';
import React from 'react';
import ReactDOM from 'react-dom';
import { addLocaleData, IntlProvider } from 'react-intl';

import { AppRoutes } from './components/AppRoutes';
import { appData } from './data/appData';
import { DecodedJwt } from './types/jwt';
// Load our style reboot into the DOM
import { GlobalStyles } from './utils/theme/baseStyles';
import { theme } from './utils/theme/theme';

const decodedToken: DecodedJwt = jwtDecode(appData.jwt);

let localeCode = decodedToken.locale;
if (localeCode.match(/^.*_.*$/)) {
  localeCode = localeCode.split('_')[0];
}

// Wait for the DOM to load before we scour it for an element that requires React to render
document.addEventListener('DOMContentLoaded', async event => {
  try {
    const localeData = await import(`react-intl/locale-data/${localeCode}`);
    addLocaleData(Object.values(localeData));
  } catch (e) {}

  let translatedMessages = null;
  try {
    translatedMessages = await import(
      `./translations/${decodedToken.locale}.json`
    );
  } catch (e) {}

  // Render our actual component tree
  ReactDOM.render(
    <IntlProvider locale={localeCode} messages={translatedMessages}>
      <Grommet theme={theme}>
        <AppRoutes />
        <GlobalStyles />
      </Grommet>
    </IntlProvider>,
    document.querySelector('#marsha-frontend-root'),
  );
});
