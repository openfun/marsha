import { Grommet } from 'grommet';
import {
  CurrentResourceContextProvider,
  decodeJwt,
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
import { colors, theme } from 'utils/theme/theme';

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
  const { jwt } = useJwt();
  const intlShape = useIntl();

  let Content: LazyExoticComponent<ComponentType<any>>;
  if (appConfig.appName) Content = appsContent[appConfig.appName];
  else if (appConfig.frontend) Content = appsContent[appConfig.frontend];
  else throw new Error(intlShape.formatMessage(messages.errorAppSet));

  useEffect(() => {
    if (jwt) {
      return;
    }

    throw new Error(intlShape.formatMessage(messages.errorJwtEmpty));
  }, [jwt]);

  return <Content />;
};

const AppContentLoader = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const queryClient = useMemo(() => new QueryClient(), []);

  //  load it from the store to prevent having a dependancy and recompute decodedJwt
  const decodedJwt = useMemo(() => decodeJwt(useJwt.getState().jwt), []);
  const resourceContext: ResourceContext = useMemo(
    () => ({ ...decodedJwt }),
    [decodedJwt],
  );
  const intl = useMemo(() => createIntl(decodedJwt.locale), [decodedJwt]);

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

    setIsLoaded(true);
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
