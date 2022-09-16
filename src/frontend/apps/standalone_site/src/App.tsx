import { Grommet, Header, Main, Page } from 'grommet';
import { theme } from 'lib-common';
import React from 'react';

import './App.css';

const App = () => {
  return (
    <Grommet theme={theme}>
      <Main>
        <Page kind="full">
          <Header>My first page</Header>
        </Page>
      </Main>
    </Grommet>
  );
};

export default App;
