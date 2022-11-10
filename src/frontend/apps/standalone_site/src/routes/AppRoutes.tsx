import { lazyImport } from 'lib-common';
import { Suspense, useEffect } from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';

import { MainLayout } from 'components/Layout';
import { ContentSpinner } from 'components/Spinner';
import { Header } from 'features/Header';
import { Menu } from 'features/Menu';

import { routes } from './routes';

const { ClassRooms } = lazyImport(() => import('features/ClassRooms'));
const { Favorites } = lazyImport(() => import('features/Favorites'));
const { HomePage } = lazyImport(() => import('features/HomePage'));
const { PlaylistPage } = lazyImport(
  () => import('features/Playlist/components/PlaylistPage'),
);

function AppRoutes() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [location]);

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
        <Route path={routes.CONTENTS.subRoutes.CLASSROOM.path}>
          <Suspense fallback={<ContentSpinner />}>
            <ClassRooms />
          </Suspense>
        </Route>
      </Switch>
    </MainLayout>
  );
}

export default AppRoutes;
