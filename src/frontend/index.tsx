import 'iframe-resizer/js/iframeResizer.contentWindow';

import React from 'react';
import ReactDOM from 'react-dom';
import { IntlProvider } from 'react-intl';

import { App } from './components/App/App';
import { AppRoutes } from './components/AppRoutes/AppRoutes';
import { parseDataElements } from './utils/parseDataElements/parseDataElements';
import { baseStyles } from './utils/theme/baseStyles';

export const appData = {
  ...parseDataElements(
    // Spread to pass an array instead of a NodeList
    [...document.querySelectorAll('.marsha-frontend-data')],
  ),
};

// Wait for the DOM to load before we scour it for an element that requires React to render
document.addEventListener('DOMContentLoaded', event => {
  // Load our style reboot into the DOM
  baseStyles();
  // Render our actual component tree
  ReactDOM.render(
    <IntlProvider>
      <App>
        <AppRoutes />
      </App>
    </IntlProvider>,
    document.querySelector('#marsha-frontend-root'),
  );
});
