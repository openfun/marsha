import { Box, Spinner } from 'grommet';
import React, { Suspense } from 'react';
import { Route, Switch } from 'react-router-dom';

import { MainLayout } from 'components/Layout';
import { Header } from 'features/Header';
import { Menu } from 'features/Menu';
import { lazyImport } from 'utils/lazyImport';

import { routes } from './routes';

const { HomePage } = lazyImport(() => import('features/HomePage'), 'HomePage');
const { Favorites } = lazyImport(
  () => import('features/Favorites'),
  'Favorites',
);

const RouteSpinner = () => (
  <Box height="full" justify="center" align="center">
    <Spinner size="medium" />
  </Box>
);

function AppRoutes() {
  return (
    <MainLayout menu={<Menu />}>
      <Header />
      <Switch>
        <Route path={routes.HomePage.path} exact>
          <Suspense fallback={<RouteSpinner />}>
            <HomePage />
          </Suspense>
        </Route>
        <Route path={routes.Favorites.path} exact>
          <Suspense fallback={<RouteSpinner />}>
            <Favorites />
          </Suspense>
        </Route>
      </Switch>
    </MainLayout>
  );
}

export default AppRoutes;
