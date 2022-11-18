import { lazyImport } from 'lib-common';
import { Suspense, useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Route, Switch, useLocation } from 'react-router-dom';

import { MainLayout } from 'components/Layout';
import { ContentSpinner } from 'components/Spinner';
import { Header } from 'features/Header';
import { Menu } from 'features/Menu';

import { routes } from './routes';

const { ClassRoom } = lazyImport(() => import('features/ClassRoom'));
const { HomePage } = lazyImport(() => import('features/HomePage'));
const { PlaylistPage } = lazyImport(() => import('features/Playlist'));

const messages = defineMessages({
  metaTitle: {
    defaultMessage: 'Marsha',
    description: 'Meta title website',
    id: 'routes.AppRoutes.metaTitle',
  },
  metaDescription: {
    defaultMessage: 'Marsha',
    description: 'Meta description website',
    id: 'routes.AppRoutes.metaDescription',
  },
});

function AppRoutes() {
  const intl = useIntl();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [location]);

  useEffect(() => {
    document.title = intl.formatMessage(messages.metaTitle);
    document
      .querySelector("[name='description']")
      ?.setAttribute('content', intl.formatMessage(messages.metaDescription));
  }, [intl]);

  return (
    <MainLayout Header={Header} menu={<Menu />}>
      <Switch>
        <Route path={routes.HOMEPAGE.path} exact>
          <Suspense fallback={<ContentSpinner />}>
            <HomePage />
          </Suspense>
        </Route>
        <Route path={routes.PLAYLIST.path} exact>
          <Suspense fallback={<ContentSpinner />}>
            <PlaylistPage />
          </Suspense>
        </Route>
        <Route
          path={[
            routes.CONTENTS.path,
            routes.CONTENTS.subRoutes.CLASSROOM.path,
          ]}
        >
          <Suspense fallback={<ContentSpinner />}>
            <ClassRoom />
          </Suspense>
        </Route>
      </Switch>
    </MainLayout>
  );
}

export default AppRoutes;
