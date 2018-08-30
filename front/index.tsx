import React from 'react';
import ReactDOM from 'react-dom';
import { IntlProvider } from 'react-intl';

import { RootComponent } from './components/RootComponent/RootComponent';
import { parseDataElements } from './utils/parseDataElements/parseDataElements';

const appData = parseDataElements(
  // Spread to pass an array instead of a NodeList
  [...document.querySelectorAll('.marsha-frontend-data')],
);
export const AppDataContext = React.createContext(appData);

// Wait for the DOM to load before we scour it for an element that requires React to render
document.addEventListener('DOMContentLoaded', event => {
  ReactDOM.render(
    <IntlProvider>
      <AppDataContext.Provider value={appData}>
        <RootComponent />
      </AppDataContext.Provider>
    </IntlProvider>,
    document.querySelector('#marsha-frontend-root'),
  );
});
