import { DASHBOARD_CLASSROOM_ROUTE } from 'lib-classroom';
import { lazyImport } from 'lib-common';
import {
  ErrorComponents,
  FULL_SCREEN_ERROR_ROUTE,
  FullScreenError,
  Loader,
  WithParams,
  builderFullScreenErrorRoute,
  useAppConfig,
} from 'lib-components';
import React, { Suspense } from 'react';
import {
  MemoryRouter,
  Navigate,
  Route,
  Routes as RoutesDom,
} from 'react-router-dom';

import { classroomAppData } from 'apps/classroom/data/classroomAppData';
import { PortabilityRequest } from 'components/PortabilityRequest';
import { RESOURCE_PORTABILITY_REQUEST_ROUTE } from 'components/PortabilityRequest/route';

import { RedirectOnLoad } from './RedirectOnLoad';
import { REDIRECT_ON_LOAD_ROUTE } from './RedirectOnLoad/route';

const { DashboardClassroom } = lazyImport(() => import('lib-classroom'));

const Wrappers = ({ children }: React.PropsWithChildren) => (
  <MemoryRouter>
    <div className={`marsha-${classroomAppData.frontend}`}>{children}</div>
  </MemoryRouter>
);

const Routes = () => {
  const appData = useAppConfig();

  return (
    <Wrappers>
      <Suspense fallback={<Loader />}>
        <RoutesDom>
          <Route
            path={DASHBOARD_CLASSROOM_ROUTE}
            element={
              <DashboardClassroom
                classroomId={classroomAppData.classroom?.id || ''}
              />
            }
          />

          <Route
            path={FULL_SCREEN_ERROR_ROUTE.default}
            element={
              <WithParams>
                {({ code }) => (
                  <FullScreenError code={code as ErrorComponents} />
                )}
              </WithParams>
            }
          />

          <Route
            path={RESOURCE_PORTABILITY_REQUEST_ROUTE}
            element={
              appData.portability ? (
                <PortabilityRequest portability={appData.portability} />
              ) : (
                <Navigate
                  to={builderFullScreenErrorRoute(ErrorComponents.notFound)}
                />
              )
            }
          />

          <Route path={REDIRECT_ON_LOAD_ROUTE} element={<RedirectOnLoad />} />
        </RoutesDom>
      </Suspense>
    </Wrappers>
  );
};

export default Routes;
