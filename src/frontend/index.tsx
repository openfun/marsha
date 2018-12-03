import 'iframe-resizer/js/iframeResizer.contentWindow';

import React from 'react';
import ReactDOM from 'react-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';

import { AppRoutesConnected } from './components/AppRoutesConnected/AppRoutesConnected';
import { bootstrapStore } from './data/bootstrapStore';
import { parseDataElements } from './utils/parseDataElements/parseDataElements';
import { baseStyles } from './utils/theme/baseStyles';

export const appData = {
  ...parseDataElements(
    // Spread to pass an array instead of a NodeList
    [...document.querySelectorAll('.marsha-frontend-data')],
  ),
};

const store = bootstrapStore(appData);

// Wait for the DOM to load before we scour it for an element that requires React to render
document.addEventListener('DOMContentLoaded', event => {
  // Load our style reboot into the DOM
  baseStyles();
  // Render our actual component tree
  ReactDOM.render(
    <IntlProvider>
      <Provider store={store}>
        <AppRoutesConnected />
      </Provider>
    </IntlProvider>,
    document.querySelector('#marsha-frontend-root'),
  );
});
