import 'iframe-resizer/js/iframeResizer.contentWindow';

import { Grommet } from 'grommet';
import React from 'react';
import ReactDOM from 'react-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';

import { AppRoutesConnected } from './components/AppRoutesConnected/AppRoutesConnected';
import { bootstrapStore } from './data/bootstrapStore';
import { parseDataElements } from './utils/parseDataElements/parseDataElements';
// Load our style reboot into the DOM
import { GlobalStyles } from './utils/theme/baseStyles';

export const appData = {
  ...parseDataElements(
    // Spread to pass an array instead of a NodeList
    [...document.querySelectorAll('.marsha-frontend-data')],
  ),
};

const store = bootstrapStore(appData);

// Wait for the DOM to load before we scour it for an element that requires React to render
document.addEventListener('DOMContentLoaded', event => {
  // Render our actual component tree
  ReactDOM.render(
    <IntlProvider>
      <Grommet plain>
        <Provider store={store}>
          <AppRoutesConnected />
          <GlobalStyles />
        </Provider>
      </Grommet>
    </IntlProvider>,
    document.querySelector('#marsha-frontend-root'),
  );
});
