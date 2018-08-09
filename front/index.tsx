import React from 'react';
import ReactDOM from 'react-dom';
import { IntlProvider } from 'react-intl';

import { RootComponent } from './components/RootComponent/RootComponent';

// Wait for the DOM to load before we scour it for an element that requires React to render
document.addEventListener('DOMContentLoaded', event => {
  ReactDOM.render(
    <IntlProvider>
      <RootComponent />
    </IntlProvider>,
    document.querySelector('#marsha-frontend-root'),
  );
});
