import { lazyImport } from 'lib-common';
import { Loader } from 'lib-components';
import { Suspense, useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Route, Switch, useHistory, useLocation } from 'react-router-dom';

import { MainLayout } from 'components/Layout';
import { ContentSpinner } from 'components/Spinner';
import { useAuthenticator } from 'features/Authentication';
import { Footer } from 'features/Footer';
import { Header, HeaderLight } from 'features/Header';
import { HomePage } from 'features/HomePage';
import { Menu } from 'features/Menu';
import { PagesApi, usePagesApi } from 'features/PagesApi';

import { routes } from './routes';

const { AuthRouter } = lazyImport(() => import('features/Authentication'));
const { ContentsRouter } = lazyImport(() => import('features/Contents/'));
const { PlaylistRouter } = lazyImport(() => import('features/Playlist'));
const { PortabilityRequestsRouteComponent } = lazyImport(
  () => import('features/PortabilityRequests'),
);
const { ProfileRouter } = lazyImport(() => import('features/Profile'));

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

const AppRoutes = () => {
  const intl = useIntl();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuthenticator();

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

  if (isLoading) {
    return <Loader />;
  }

  if (isAuthenticated) {
    return <AuthenticatedRoutes />;
  }

  return <AnonymousRoutes />;
};

const AnonymousRoutes = () => {
  const { routesPagesApi } = usePagesApi();

  return (
    <Switch>
      <Route
        path={routes.CONTENTS.subRoutes.CLASSROOM.subRoutes?.INVITE?.path}
        exact
      >
        <MainLayout
          Header={HeaderLight}
          direction="column"
          footer={<Footer />}
          contentBoxProps={{ pad: { horizontal: 'medium', vertical: 'small' } }}
        >
          <Suspense
            fallback={<ContentSpinner boxProps={{ height: '100vh' }} />}
          >
            <ContentsRouter />
          </Suspense>
        </MainLayout>
      </Route>

      <Route path={routesPagesApi} exact>
        <MainLayout
          Header={HeaderLight}
          direction="column"
          footer={<Footer />}
          contentBoxProps={{ pad: { horizontal: 'medium', vertical: 'small' } }}
        >
          <Suspense
            fallback={<ContentSpinner boxProps={{ height: '100vh' }} />}
          >
            <PagesApi />
          </Suspense>
        </MainLayout>
      </Route>

      <Route>
        <Suspense fallback={<ContentSpinner boxProps={{ height: '100vh' }} />}>
          <AuthRouter />
        </Suspense>
      </Route>
    </Switch>
  );
};

const AuthenticatedRoutes = () => {
  const history = useHistory();
  const { pathname } = useLocation();
  const { routesPagesApi } = usePagesApi();

  /**
   * Redirect to homepage if user try to access login page when authenticated
   */
  useEffect(() => {
    if (pathname === routes.LOGIN.path) {
      history.replace(routes.HOMEPAGE.path);
    }
  }, [history, pathname]);

  return (
    <Switch>
      <Route>
        <MainLayout Header={Header} menu={<Menu />} footer={<Footer />}>
          <Switch>
            <Route path={routes.HOMEPAGE.path} exact>
              <HomePage />
            </Route>

            <Route path={routes.PLAYLIST.path}>
              <Suspense fallback={<ContentSpinner />}>
                <PlaylistRouter />
              </Suspense>
            </Route>

            <Route path={routes.CONTENTS.path}>
              <Suspense fallback={<ContentSpinner />}>
                <ContentsRouter />
              </Suspense>
            </Route>

            <Route path={routes.PORTABILITY_REQUESTS.path} exact>
              <Suspense fallback={<ContentSpinner />}>
                <PortabilityRequestsRouteComponent />
              </Suspense>
            </Route>

            <Route path={routes.PROFILE.path}>
              <Suspense fallback={<ContentSpinner />}>
                <ProfileRouter />
              </Suspense>
            </Route>

            <Route path={routesPagesApi}>
              <Suspense fallback={<ContentSpinner />}>
                <PagesApi />
              </Suspense>
            </Route>
          </Switch>
        </MainLayout>
      </Route>
    </Switch>
  );
};

export default AppRoutes;
