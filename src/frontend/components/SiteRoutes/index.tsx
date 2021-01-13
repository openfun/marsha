import { Heading, Main } from 'grommet';
import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import { SiteLayout } from '../SiteLayout';

export const Routes = () => (
  <BrowserRouter>
    <SiteLayout>
      <Switch>
        <Route>
          <Main>
            <Heading margin="medium">The main content</Heading>
          </Main>
        </Route>
      </Switch>
    </SiteLayout>
  </BrowserRouter>
);
