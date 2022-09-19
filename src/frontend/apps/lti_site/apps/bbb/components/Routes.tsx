import React, { lazy, Suspense } from 'react';
import { MemoryRouter, Redirect, Route, Switch } from 'react-router-dom';

import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
import { Loader } from 'lib-components';
import { useIsFeatureEnabled } from 'data/hooks/useIsFeatureEnabled';
import { flags } from 'types/AppData';

import { bbbAppData } from 'apps/bbb/data/bbbAppData';

const DashboardClassroom = lazy(() => import('./DashboardClassroom'));

const Wrappers = ({ children }: React.PropsWithChildren<{}>) => (
  <MemoryRouter>
    <div className={`marsha-${bbbAppData.frontend}`}>{children}</div>
  </MemoryRouter>
);

const Routes = () => {
  const isFeatureEnabled = useIsFeatureEnabled();

  if (isFeatureEnabled(flags.BBB)) {
    return (
      <Wrappers>
        <Suspense fallback={<Loader />}>
          <Switch>
            <Route exact path="/" render={() => <DashboardClassroom />} />
          </Switch>
        </Suspense>
      </Wrappers>
    );
  } else {
    return (
      <Wrappers>
        <Redirect push to={FULL_SCREEN_ERROR_ROUTE('notFound')} />
      </Wrappers>
    );
  }
};

export default Routes;
