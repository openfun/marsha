import React from 'react';
import ReactDOM from 'react-dom';
import { IntlProvider } from 'react-intl';

import { RootComponent } from './components/RootComponent/RootComponent';
import { parseDataElements } from './utils/parseDataElements/parseDataElements';

export const StateContext = React.createContext('state');

// Wait for the DOM to load before we scour it for an element that requires React to render
document.addEventListener('DOMContentLoaded', event => {
  const appData = parseDataElements(
    // Spread to pass an array instead of a NodeList
    [...document.querySelectorAll('.marsha-frontend-data')],
  );

  ReactDOM.render(
    <IntlProvider>
      <StateContext.Provider value={appData.state}>
        <RootComponent />
      </StateContext.Provider>
    </IntlProvider>,
    document.querySelector('#marsha-frontend-root'),
  );
});
