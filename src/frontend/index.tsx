import 'iframe-resizer/js/iframeResizer.contentWindow';

import { Grommet } from 'grommet';
import jwtDecode from 'jwt-decode';
import React from 'react';
import ReactDOM from 'react-dom';
import { addLocaleData, IntlProvider } from 'react-intl';
import en from 'react-intl/locale-data/en';
import es from 'react-intl/locale-data/es';
import fr from 'react-intl/locale-data/fr';
import { Provider } from 'react-redux';

import { AppRoutesConnected } from './components/AppRoutesConnected/AppRoutesConnected';
import { appData } from './data/appData';
import { bootstrapStore } from './data/bootstrapStore';
import translatedMessages from './translations/translation.json';
import { DecodedJwt } from './types/jwt';
import { localesMapping, TranslatedMessages } from './types/translation';
// Load our style reboot into the DOM
import { GlobalStyles } from './utils/theme/baseStyles';
import { theme } from './utils/theme/theme';

const store = bootstrapStore(appData);
addLocaleData([...en, ...es, ...fr]);

const decodedToken: DecodedJwt = jwtDecode(appData.jwt);

const messages =
  (translatedMessages as TranslatedMessages)[
    localesMapping[decodedToken.locale]
  ] || null;

// Wait for the DOM to load before we scour it for an element that requires React to render
document.addEventListener('DOMContentLoaded', event => {
  // Render our actual component tree
  ReactDOM.render(
    <IntlProvider locale={decodedToken.locale} messages={messages}>
      <Grommet theme={theme}>
        <Provider store={store}>
          <AppRoutesConnected />
          <GlobalStyles />
        </Provider>
      </Grommet>
    </IntlProvider>,
    document.querySelector('#marsha-frontend-root'),
  );
});
