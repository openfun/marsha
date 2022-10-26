import React, { lazy, Suspense } from 'react';
import { MemoryRouter, Route } from 'react-router-dom';

import {
  ErrorComponentsProps,
  FullScreenError,
  FULL_SCREEN_ERROR_ROUTE,
  Loader,
} from 'lib-components';

import { classroomAppData } from 'apps/classroom/data/classroomAppData';
import { DASHBOARD_CLASSROOM_ROUTE } from './DashboardClassroom/route';
import { REDIRECT_ON_LOAD_ROUTE } from './RedirectOnLoad/route';
import { RedirectOnLoad } from './RedirectOnLoad';

const DashboardClassroom = lazy(() => import('./DashboardClassroom'));

const Wrappers = ({ children }: React.PropsWithChildren<{}>) => (
  <MemoryRouter>
    <div className={`marsha-${classroomAppData.frontend}`}>{children}</div>
  </MemoryRouter>
);

const Routes = () => {
  return (
    <Wrappers>
      <Suspense fallback={<Loader />}>
        <MemoryRouter>
          <Route
            exact
            path={DASHBOARD_CLASSROOM_ROUTE()}
            render={() => <DashboardClassroom />}
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

          <Route path={REDIRECT_ON_LOAD_ROUTE()} component={RedirectOnLoad} />
        </MemoryRouter>
      </Suspense>
    </Wrappers>
  );
};

export default Routes;
