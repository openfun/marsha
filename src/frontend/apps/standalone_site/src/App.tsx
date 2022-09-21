import { Grommet, Main, Page } from 'grommet';
import { theme } from 'lib-common';
import React from 'react';

import './App.css';
import { AppRoutes } from './routes';

const App = () => {
  return (
    <Grommet theme={theme}>
      <Main>
        <Page kind="full">
          <AppRoutes />
        </Page>
      </Main>
    </Grommet>
  );
};

export default App;
