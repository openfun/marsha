import { Grommet } from 'grommet';
import { colors, theme } from 'lib-common';
import {
  CurrentResourceContextProvider,
  useJwt,
  useCurrentSession,
  useCurrentUser,
  ResourceContext,
  User,
  BoundaryScreenError,
  useAppConfig,
  appNames,
  Loader,
} from 'lib-components';
import React, {
  ComponentType,
  lazy,
  LazyExoticComponent,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';
import { RawIntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { defineMessages, useIntl } from 'react-intl';

import { createIntl } from 'utils/lang';
import { GlobalStyles } from 'utils/theme/baseStyles';

const messages = defineMessages({
  errorJwtEmpty: {
    defaultMessage: 'Please reload your page',
    description:
      'JWT empty, can be from the service worker and the refresh token expired',
    id: 'components.App.AppContentLoader.errorJwtEmpty',
  },
  errorAppSet: {
    defaultMessage: 'Application and frontend are not properly set',
    description: 'Application and frontend are not properly set',
    id: 'components.App.AppContentLoader.errorAppSet',
  },
});

const appsContent: Record<string, LazyExoticComponent<ComponentType<any>>> = {
  LTI: lazy(() => import('components/LTIRoutes')),
};
Object.values(appNames).forEach((app) => {
  appsContent[app] = lazy(() => import(`apps/${app}/components/Routes`));
});

const AppContent = () => {
  const appConfig = useAppConfig();
  const intlShape = useIntl();

  let Content: LazyExoticComponent<ComponentType<any>>;
  if (appConfig.appName) Content = appsContent[appConfig.appName];
  else if (appConfig.frontend) Content = appsContent[appConfig.frontend];
  else throw new Error(intlShape.formatMessage(messages.errorAppSet));

  const decodedJwt = useMemo(() => {
    const jwt = useJwt.getState().jwt;
    if (jwt) {
      return useJwt.getState().getDecodedJwt();
    }
    throw new Error(
      'Unable to find a jwt Token. The ressource might not exist.',
    );
  }, []);

  useEffect(() => {
    useCurrentSession.setState({
      sessionId: decodedJwt.session_id,
    });

    const currentUser: User = {
      anonymous_id: decodedJwt.user?.anonymous_id,
      email: decodedJwt.user?.email || undefined,
      id: decodedJwt.user?.id,
      username: decodedJwt.user?.username || undefined,
      full_name: decodedJwt.user?.user_fullname,
      is_staff: false,
      is_superuser: false,
      organization_accesses: [],
    };
    useCurrentUser.setState({
      currentUser,
    });
  }, [decodedJwt]);

  return <Content />;
};

const AppContentLoader = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const queryClient = new QueryClient();

  //  load it from the store to prevent having a dependency and recompute decodedJwt
  const decodedJwt = useMemo(() => {
    const jwt = useJwt.getState().jwt;
    if (jwt) {
      setIsLoaded(true);
      return useJwt.getState().getDecodedJwt();
    }
    setIsLoaded(true);
  }, []);

  const intl = useMemo(() => {
    return createIntl(decodedJwt?.locale || 'en');
  }, [decodedJwt?.locale]);

  const resourceContext: ResourceContext = useMemo(() => {
    const defaultResourceContext: ResourceContext = {
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
      resource_id: '',
      roles: [],
    };

    if (decodedJwt) {
      return { ...decodedJwt };
    }
    return defaultResourceContext;
  }, [decodedJwt]);

  if (!isLoaded) {
    return null;
  }

  return (
    <CurrentResourceContextProvider value={resourceContext}>
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools />
        <RawIntlProvider value={intl}>
          <Grommet theme={theme} style={{ height: '100%' }}>
            <ErrorBoundary
              fallbackRender={({ error }) => (
                <BoundaryScreenError code={500} message={error.message} />
              )}
            >
              <Toaster
                toastOptions={{
                  duration: 5000,
                  success: {
                    style: {
                      background: colors['status-ok'],
                    },
                  },
                  error: {
                    style: {
                      color: colors.white,
                      background: colors['accent-2'],
                    },
                  },
                }}
              />
              <Suspense fallback={<Loader />}>
                <AppContent />
              </Suspense>
              <GlobalStyles />
            </ErrorBoundary>
          </Grommet>
        </RawIntlProvider>
      </QueryClientProvider>
    </CurrentResourceContextProvider>
  );
};

export default AppContentLoader;
