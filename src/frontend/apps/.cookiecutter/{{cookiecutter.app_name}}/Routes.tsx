import React, { lazy, Suspense } from 'react';
import { MemoryRouter, Redirect, Route } from 'react-router-dom';

import {
  ErrorComponentsProps,
  FullScreenError,
} from 'components/ErrorComponents';
import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
import { Loader } from 'components/Loader';
import { isFeatureEnabled } from 'utils/isFeatureEnabled';
import { flags } from 'types/AppData';

const Dashboard{{cookiecutter.model}} = lazy(() => import('./Dashboard{{cookiecutter.model}}'));

export const Routes = () => {
  return (
    <Suspense fallback={<Loader />}>
      <MemoryRouter>
        {isFeatureEnabled(flags.{{cookiecutter.flag}}) ? (
          <Route path="/" render={() => <Dashboard{{cookiecutter.model}} />} />
        ) : (
          <Redirect push to={FULL_SCREEN_ERROR_ROUTE('notFound')} />
        )}
        <Route
          exact
          path={FULL_SCREEN_ERROR_ROUTE()}
          render={({ match }) => (
            <FullScreenError
              code={match.params.code as ErrorComponentsProps['code']}
            />
          )}
        />
      </MemoryRouter>
    </Suspense>
  );
};
