import React, { Suspense } from 'react';
import { MemoryRouter, Route } from 'react-router-dom';
import {
  ErrorComponentsProps,
  FullScreenError,
  FULL_SCREEN_ERROR_ROUTE,
  Loader,
  useAppConfig,
} from 'lib-components';
import { DASHBOARD_CLASSROOM_ROUTE } from 'lib-classroom';
import { lazyImport } from 'lib-common';

import { PortabilityRequest } from 'components/PortabilityRequest';
import { RESOURCE_PORTABILITY_REQUEST_ROUTE } from 'components/PortabilityRequest/route';

import { classroomAppData } from 'apps/classroom/data/classroomAppData';
import { REDIRECT_ON_LOAD_ROUTE } from './RedirectOnLoad/route';
import { RedirectOnLoad } from './RedirectOnLoad';

const { DashboardClassroom } = lazyImport(() => import('lib-classroom'));

const Wrappers = ({ children }: React.PropsWithChildren<{}>) => (
  <MemoryRouter>
    <div className={`marsha-${classroomAppData.frontend}`}>{children}</div>
  </MemoryRouter>
);

const Routes = () => {
  const appData = useAppConfig();

  return (
    <Wrappers>
      <Suspense fallback={<Loader />}>
        <MemoryRouter>
          <Route
            exact
            path={DASHBOARD_CLASSROOM_ROUTE()}
            render={() => (
              <DashboardClassroom
                classroomId={classroomAppData.classroom?.id || ''}
              />
            )}
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
              <PortabilityRequest portability={appData.portability!} />
            )}
          />

          <Route path={REDIRECT_ON_LOAD_ROUTE()} component={RedirectOnLoad} />
        </MemoryRouter>
      </Suspense>
    </Wrappers>
  );
};

export default Routes;
