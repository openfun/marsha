import React from 'react';
import ReactDOM from 'react-dom';
import { IntlProvider } from 'react-intl';

import { AppRoutes } from './components/AppRoutes/AppRoutes';
import { parseDataElements } from './utils/parseDataElements/parseDataElements';
import { baseStyles } from './utils/theme/baseStyles';

const appData = parseDataElements(
  // Spread to pass an array instead of a NodeList
  [...document.querySelectorAll('.marsha-frontend-data')],
);
export const AppDataContext = React.createContext(appData);

// Wait for the DOM to load before we scour it for an element that requires React to render
document.addEventListener('DOMContentLoaded', event => {
  // Load our style reboot into the DOM
  baseStyles();
  // Render our actual component tree
  ReactDOM.render(
    <IntlProvider>
      <AppDataContext.Provider value={appData}>
        <AppRoutes />
      </AppDataContext.Provider>
    </IntlProvider>,
    document.querySelector('#marsha-frontend-root'),
  );
});
