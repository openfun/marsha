import { Grommet } from 'grommet';
import React from 'react';
import ReactDOM from 'react-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';

import { AppRoutes } from './components/AppRoutes';
import { bootstrapStore } from './data/bootstrapStore';
import { AppData, ResourceType } from './types/AppData';
// Load our style reboot into the DOM
import { GlobalStyles } from './utils/theme/baseStyles';
import { theme } from './utils/theme/theme';

export const appVideo = (
  appData: AppData<ResourceType.VIDEO>,
  localeCode: string,
  translatedMessages: any,
) => {
  const store = bootstrapStore(appData);

  ReactDOM.render(
    <IntlProvider locale={localeCode} messages={translatedMessages}>
      <Grommet theme={theme}>
        <Provider store={store}>
          <AppRoutes />
          <GlobalStyles />
        </Provider>
      </Grommet>
    </IntlProvider>,
    document.querySelector('#marsha-frontend-root'),
  );
};
