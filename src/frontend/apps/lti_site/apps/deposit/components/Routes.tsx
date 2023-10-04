import {
  BoxLoader,
  ErrorComponents,
  FULL_SCREEN_ERROR_ROUTE,
  FullScreenError,
  WithParams,
  builderFullScreenErrorRoute,
  useAppConfig,
} from 'lib-components';
import { Fragment, Suspense, lazy } from 'react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';

import { PortabilityRequest } from 'components/PortabilityRequest';
import { RESOURCE_PORTABILITY_REQUEST_ROUTE } from 'components/PortabilityRequest/route';

import { DASHBOARD_ROUTE } from './Dashboard/route';
import { RedirectOnLoad } from './RedirectOnLoad';
import { REDIRECT_ON_LOAD_ROUTE } from './RedirectOnLoad/route';

const Dashboard = lazy(() => import('./Dashboard'));

const RoutesDeposit = () => {
  const appData = useAppConfig();

  return (
    <Suspense fallback={<BoxLoader />}>
      <MemoryRouter>
        <Routes>
          <Route path={DASHBOARD_ROUTE} element={<Dashboard />} />
          <Route
            path={FULL_SCREEN_ERROR_ROUTE.default}
            element={
              <WithParams>
                {({ code }) =>
                  code ? (
                    <FullScreenError code={code as ErrorComponents} />
                  ) : (
                    <Fragment></Fragment>
                  )
                }
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
        </Routes>
      </MemoryRouter>
    </Suspense>
  );
};

export default RoutesDeposit;
