import React, { lazy, Suspense } from 'react';
import { MemoryRouter, Route } from 'react-router-dom';
import {
  ErrorComponentsProps,
  FullScreenError,
  FULL_SCREEN_ERROR_ROUTE,
  Loader,
  useAppConfig,
} from 'lib-components';

import { PortabilityRequest } from 'components/PortabilityRequest';
import { RESOURCE_PORTABILITY_REQUEST_ROUTE } from 'components/PortabilityRequest/route';

import { DASHBOARD_ROUTE } from './Dashboard/route';
import { RedirectOnLoad } from './RedirectOnLoad';
import { REDIRECT_ON_LOAD_ROUTE } from './RedirectOnLoad/route';

const Dashboard = lazy(() => import('./Dashboard'));

const Routes = () => {
  const appData = useAppConfig();

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

        <Route
          exact
          path={RESOURCE_PORTABILITY_REQUEST_ROUTE()}
          render={() => (
            <PortabilityRequest portability={appData.portability!} />
          )}
        />

        <Route path={REDIRECT_ON_LOAD_ROUTE()} component={RedirectOnLoad} />
      </MemoryRouter>
    </Suspense>
  );
};

export default Routes;
