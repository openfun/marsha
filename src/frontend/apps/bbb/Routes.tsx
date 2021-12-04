import React, { lazy, Suspense } from 'react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';

import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
import { Loader } from 'components/Loader';
import { isFeatureEnabled } from 'utils/isFeatureEnabled';
import { flags } from 'types/AppData';

import { bbbAppData } from 'apps/bbb/data/bbbAppData';

const DashboardMeeting = lazy(() => import('./DashboardMeeting'));

const Wrappers = ({ children }: React.PropsWithChildren<{}>) => (
  <MemoryRouter>
    <div className={`marsha-${bbbAppData.frontend}`}>{children}</div>
  </MemoryRouter>
);

const BBBRoutes = () => {
  if (isFeatureEnabled(flags.BBB)) {
    return (
      <Wrappers>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<DashboardMeeting />} />
          </Routes>
        </Suspense>
      </Wrappers>
    );
  } else {
    return (
      <Wrappers>
        <Navigate to={FULL_SCREEN_ERROR_ROUTE('notFound')} />
      </Wrappers>
    );
  }
};

export default BBBRoutes;