import { colorsTokens, lazyImport } from 'lib-common';
import { BoxError, BoxLoader } from 'lib-components';
import { Suspense, useEffect } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { MainLayout } from 'components/Layout';
import { Text404 } from 'components/Text';
import { useAuthenticator } from 'features/Authentication';
import { Footer } from 'features/Footer';
import { Header, HeaderLight, HeaderLightLink } from 'features/Header';
import { HomePage } from 'features/HomePage';
import { Menu } from 'features/Menu';
import { PagesApi, usePagesApi } from 'features/PagesApi';
import { useRoutes } from 'routes/useRoutes';

const { AuthRouter } = lazyImport(() => import('features/Authentication'));
const { ContentsRouter, ClassRoomUpdate } = lazyImport(
  () => import('features/Contents/'),
);
const { PlaylistRouter } = lazyImport(() => import('features/Playlist'));
const { PortabilityRequestsRouteComponent } = lazyImport(
  () => import('features/PortabilityRequests'),
);
const { ProfileRouter } = lazyImport(() => import('features/Profile'));
const { ClaimResource } = lazyImport(() => import('features/ClaimResource'));

const AppRoutes = () => {
  const location = useLocation();
  const { isAuthenticated, isLoading, error } = useAuthenticator();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [location.pathname]);

  if (error) {
    return (
      <MainLayout
        Header={HeaderLight}
        direction="column"
        footer={<Footer />}
        contentBoxProps={{
          pad: { horizontal: 'xlarge', vertical: 'xlarge' },
        }}
      >
        <BoxError
          background="white"
          pad="large"
          round="small"
          style={{
            border: `2px solid ${colorsTokens['warning-500']}`,
          }}
          width={{ max: 'large' }}
          margin="auto"
          message={error}
        />
      </MainLayout>
    );
  }

  if (isLoading) {
    return <BoxLoader boxProps={{ height: '100vh' }} />;
  }

  if (isAuthenticated) {
    return <AuthenticatedRoutes />;
  }

  return <AnonymousRoutes />;
};

const AnonymousRoutes = () => {
  const { routesPagesApi, isPagesLoading } = usePagesApi();
  const routes = useRoutes();

  if (isPagesLoading) {
    return <BoxLoader boxProps={{ height: '100vh' }} />;
  }

  return (
    <Routes>
      <Route
        path={routes.CONTENTS.subRoutes?.CLASSROOM?.subRoutes?.INVITE.path}
        element={
          <MainLayout
            Header={HeaderLight}
            direction="column"
            footer={<Footer />}
            contentBoxProps={{
              pad: { horizontal: 'medium', vertical: 'small' },
            }}
          >
            <Suspense fallback={<BoxLoader boxProps={{ height: '100vh' }} />}>
              <ClassRoomUpdate />
            </Suspense>
          </MainLayout>
        }
      />

      {routesPagesApi.map((route) => (
        <Route
          key={route}
          path={route}
          element={
            <MainLayout
              Header={HeaderLightLink}
              direction="column"
              footer={<Footer />}
              contentBoxProps={{
                pad: { horizontal: 'medium', vertical: 'small' },
              }}
            >
              <Suspense fallback={<BoxLoader boxProps={{ height: '100vh' }} />}>
                <PagesApi />
              </Suspense>
            </MainLayout>
          }
        />
      ))}

      <Route
        path="*"
        element={
          <Suspense fallback={<BoxLoader boxProps={{ height: '100vh' }} />}>
            <AuthRouter />
          </Suspense>
        }
      />
    </Routes>
  );
};

const AuthenticatedRoutes = () => {
  const routes = useRoutes();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { routesPagesApi, isPagesLoading } = usePagesApi();

  /**
   * Redirect to homepage if user try to access login page when authenticated
   */
  useEffect(() => {
    if (pathname === routes.LOGIN.path) {
      navigate(routes.HOMEPAGE.path);
    }
  }, [navigate, pathname, routes]);

  if (isPagesLoading) {
    return <BoxLoader boxProps={{ height: '100vh' }} />;
  }

  return (
    <MainLayout Header={Header} menu={<Menu />} footer={<Footer />}>
      <Routes>
        <Route path={routes.HOMEPAGE.path} element={<HomePage />} />

        <Route
          path={`${routes.PLAYLIST.path}/*`}
          element={
            <Suspense fallback={<BoxLoader />}>
              <PlaylistRouter />
            </Suspense>
          }
        />

        <Route
          path={`${routes.CONTENTS.path}/*`}
          element={
            <Suspense fallback={<BoxLoader />}>
              <ContentsRouter />
            </Suspense>
          }
        />

        <Route
          path={`${routes.PORTABILITY_REQUESTS.path}/*`}
          element={
            <Suspense fallback={<BoxLoader />}>
              <PortabilityRequestsRouteComponent />
            </Suspense>
          }
        />

        <Route
          path={`${routes.PROFILE.path}/*`}
          element={
            <Suspense fallback={<BoxLoader />}>
              <ProfileRouter />
            </Suspense>
          }
        />

        {routesPagesApi.map((route) => (
          <Route
            key={route}
            path={route}
            element={
              <Suspense fallback={<BoxLoader />}>
                <PagesApi />
              </Suspense>
            }
          />
        ))}

        <Route
          path={`${routes.CLAIM_RESOURCE.path}/*`}
          element={
            <Suspense fallback={<BoxLoader />}>
              <ClaimResource />
            </Suspense>
          }
        />

        <Route path="*" element={<Text404 />} />
      </Routes>
    </MainLayout>
  );
};

export default AppRoutes;
