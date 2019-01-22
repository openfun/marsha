import 'iframe-resizer/js/iframeResizer.contentWindow';

import { Grommet } from 'grommet';
import React from 'react';
import ReactDOM from 'react-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';

import { AppRoutesConnected } from './components/AppRoutesConnected/AppRoutesConnected';
import { appData } from './data/appData';
import { bootstrapStore } from './data/bootstrapStore';
// Load our style reboot into the DOM
import { GlobalStyles } from './utils/theme/baseStyles';
import { theme } from './utils/theme/theme';

const store = bootstrapStore(appData);

// Wait for the DOM to load before we scour it for an element that requires React to render
document.addEventListener('DOMContentLoaded', event => {
  // Render our actual component tree
  ReactDOM.render(
    <IntlProvider>
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
