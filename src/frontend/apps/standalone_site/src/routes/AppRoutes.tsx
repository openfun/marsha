import { lazyImport } from 'lib-common';
import { Suspense, useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Route, Switch, useLocation } from 'react-router-dom';

import { MainLayout } from 'components/Layout';
import { ContentSpinner } from 'components/Spinner';
import { Authenticator, VisitorAuthenticator } from 'features/Authentication';
import { Header, HeaderLight } from 'features/Header';
import { Menu } from 'features/Menu';

import { routes } from './routes';

const { AuthRouter } = lazyImport(() => import('features/Authentication'));
const { ContentsRouter } = lazyImport(() => import('features/Contents/'));
const { HomePage } = lazyImport(() => import('features/HomePage'));
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
    <Switch>
      <Route
        path={routes.CONTENTS.subRoutes.CLASSROOM.subRoutes?.INVITE?.path}
        exact
      >
        <VisitorAuthenticator>
          <MainLayout Header={HeaderLight} direction="column">
            <Suspense
              fallback={<ContentSpinner boxProps={{ height: '100vh' }} />}
            >
              <ContentsRouter />
            </Suspense>
          </MainLayout>
        </VisitorAuthenticator>
      </Route>
      <Route
        path={[
          routes.LOGIN.path,
          routes.PASSWORD_RESET.path,
          routes.PASSWORD_RESET_CONFIRM.path,
        ]}
        exact
      >
        <Suspense fallback={<ContentSpinner boxProps={{ height: '100vh' }} />}>
          <AuthRouter />
        </Suspense>
      </Route>

      <Route>
        <Authenticator>
          <MainLayout Header={Header} menu={<Menu />}>
            <Switch>
              <Route path={routes.HOMEPAGE.path} exact>
                <Suspense fallback={<ContentSpinner />}>
                  <HomePage />
                </Suspense>
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
            </Switch>
          </MainLayout>
        </Authenticator>
      </Route>
    </Switch>
  );
};

export default AppRoutes;
