import React, { lazy, Suspense } from 'react';
import { MemoryRouter, Route } from 'react-router-dom';

import {
  ErrorComponentsProps,
  FullScreenError,
} from 'components/ErrorComponents';
import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
import { Loader } from 'lib-components';

import { DASHBOARD_ROUTE } from './Dashboard/route';
import { RedirectOnLoad } from './RedirectOnLoad';
import { REDIRECT_ON_LOAD_ROUTE } from './RedirectOnLoad/route';

const Dashboard = lazy(() => import('./Dashboard'));

const Routes = () => {
  return (
    <Suspense fallback={<Loader />}>
      <MemoryRouter>
        <Route exact path={DASHBOARD_ROUTE()} render={() => <Dashboard />} />

        <Route
          exact
          path={FULL_SCREEN_ERROR_ROUTE()}
          render={({ match }) => (
            <FullScreenError
              code={match.params.code as ErrorComponentsProps['code']}
            />
          )}
        />

        <Route path={REDIRECT_ON_LOAD_ROUTE()} component={RedirectOnLoad} />
      </MemoryRouter>
    </Suspense>
  );
};

export default Routes;
