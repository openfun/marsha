import React, { lazy, Suspense } from 'react';
import { MemoryRouter, Redirect, Route } from 'react-router-dom';

import {
  ErrorComponentsProps,
  FullScreenError,
} from 'components/ErrorComponents';
import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
import { Loader } from 'components/Loader';
import { useIsFeatureEnabled } from 'data/hooks/useIsFeatureEnabled';
import { flags } from 'types/AppData';

const Dashboard = lazy(() => import('./Dashboard'));

const Routes = () => {
  const isFeatureEnabled = useIsFeatureEnabled();
  return (
    <Suspense fallback={<Loader />}>
      <MemoryRouter>
        {isFeatureEnabled(flags.DEPOSIT) ? (
          <Route path="/" render={() => <Dashboard />} />
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

export default Routes;
