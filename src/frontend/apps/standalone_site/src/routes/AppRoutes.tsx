import { lazyImport } from 'lib-common';
import { Suspense } from 'react';
import { Route, Switch } from 'react-router-dom';

import { MainLayout } from 'components/Layout';
import { ContentSpinner } from 'components/Spinner';
import { Header } from 'features/Header';
import { Menu } from 'features/Menu';

import { routes } from './routes';

const { HomePage } = lazyImport(() => import('features/HomePage'));
const { Favorites } = lazyImport(() => import('features/Favorites'));
const { PlaylistPage } = lazyImport(
  () => import('features/Playlist/components/PlaylistPage'),
);

function AppRoutes() {
  return (
    <MainLayout Header={Header} menu={<Menu />}>
      <Switch>
        <Route path={routes.HOMEPAGE.path} exact>
          <Suspense fallback={<ContentSpinner />}>
            <HomePage />
          </Suspense>
        </Route>
        <Route path={routes.FAVORITE.path} exact>
          <Suspense fallback={<ContentSpinner />}>
            <Favorites />
          </Suspense>
        </Route>
        <Route path={routes.PLAYLIST.path} exact>
          <Suspense fallback={<ContentSpinner />}>
            <PlaylistPage />
          </Suspense>
        </Route>
        <Route path={routes.CONTENTS.subRoutes.CLASSROOM.path} exact>
          <Suspense fallback={<ContentSpinner />}>
            <HomePage />
          </Suspense>
        </Route>
      </Switch>
    </MainLayout>
  );
}

export default AppRoutes;
