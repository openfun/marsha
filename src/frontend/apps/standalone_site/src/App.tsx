import { Grommet, Main, Page } from 'grommet';
import React from 'react';
import { themeExtend } from 'style/theme.extend';

import './App.css';
import { AppRoutes } from './routes';

const App = () => {
  return (
    <Grommet theme={themeExtend}>
      <Main>
        <Page kind="full">
          <AppRoutes />
        </Page>
      </Main>
    </Grommet>
  );
};

export default App;
