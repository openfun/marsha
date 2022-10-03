import React, { lazy, Suspense } from 'react';
import { MemoryRouter, Route } from 'react-router-dom';

import { Loader } from 'lib-components';

import {
  ErrorComponentsProps,
  FullScreenError,
  FULL_SCREEN_ERROR_ROUTE,
  useAppConfig,
} from 'lib-components';

import { PortabilityRequest } from 'components/PortabilityRequest';
import { RESOURCE_PORTABILITY_REQUEST_ROUTE } from 'components/PortabilityRequest/route';

import { DASHBOARD_{{ cookiecutter.app_name|upper }}_ROUTE } from './Dashboard{{cookiecutter.model}}/route';
import { RedirectOnLoad } from './RedirectOnLoad';
import { REDIRECT_ON_LOAD_ROUTE } from './RedirectOnLoad/route';

const Dashboard{{cookiecutter.model}} = lazy(() => import('./Dashboard{{cookiecutter.model}}'));

export const Routes = () => {
  const appData = useAppConfig();

  return (
    <Suspense fallback={<Loader />}>
      <MemoryRouter>
        <Route
          exact
          path={DASHBOARD_{{ cookiecutter.app_name|upper }}_ROUTE()}
          render={() => <Dashboard{{cookiecutter.model}} />}
        />

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
            <PortabilityRequest
              portability={appData.portability!}
            />
          )}
        />

        <Route path={REDIRECT_ON_LOAD_ROUTE()} component={RedirectOnLoad} />
      </MemoryRouter>
    </Suspense>
  );
};
