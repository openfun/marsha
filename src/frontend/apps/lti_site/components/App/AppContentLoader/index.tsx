import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Grommet } from 'grommet';
import { colors, theme } from 'lib-common';
import {
  BoundaryScreenError,
  CurrentResourceContextProvider,
  DecodedJwtLTI,
  Loader,
  ResourceContext,
  User,
  appNames,
  retryQuery,
  useAppConfig,
  useCurrentSession,
  useCurrentUser,
  useJwt,
} from 'lib-components';
import React, {
  ComponentType,
  LazyExoticComponent,
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'react-hot-toast';
import {
  IntlShape,
  RawIntlProvider,
  defineMessages,
  useIntl,
} from 'react-intl';

import { ClaimLink } from 'components/ClaimLink';
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

const appsContent: Record<string, LazyExoticComponent<ComponentType>> = {
  LTI: lazy(() => import('components/LTIRoutes')),
};
Object.values(appNames).forEach((app) => {
  appsContent[app] = lazy(
    () =>
      import(`apps/${app}/components/Routes`) as Promise<{
        default: ComponentType;
      }>,
  );
});

const AppContent = () => {
  const appConfig = useAppConfig();
  const intlShape = useIntl();

  let Content: LazyExoticComponent<ComponentType>;
  if (appConfig.appName) {
    Content = appsContent[appConfig.appName];
  } else if (appConfig.frontend) {
    Content = appsContent[appConfig.frontend];
  } else {
    throw new Error(intlShape.formatMessage(messages.errorAppSet));
  }

  const decodedJwt = useMemo(() => {
    const jwt = useJwt.getState().getJwt();
    if (jwt) {
      return useJwt.getState().getDecodedJwt() as DecodedJwtLTI;
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

  return (
    <React.Fragment>
      <ClaimLink decodedJwt={decodedJwt} />
      <Content />
    </React.Fragment>
  );
};

const AppContentLoader = () => {
  const appData = useAppConfig();
  const [isLoaded, setIsLoaded] = useState(false);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: retryQuery,
      },
    },
  });

  //  load it from the store to prevent having a dependency and recompute decodedJwt
  const decodedJwt = useMemo(() => {
    const jwt = useJwt.getState().getJwt();
    if (jwt) {
      setIsLoaded(true);
      return useJwt.getState().getDecodedJwt() as DecodedJwtLTI;
    }
    setIsLoaded(true);
  }, []);

  const [intl, setIntl] = useState<IntlShape>();

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
      return {
        ...decodedJwt,
        resource_id: appData.resource?.id || '',
        playlist_id: (decodedJwt.port_to_playlist_id as string) || '',
      };
    }
    return defaultResourceContext;
  }, [appData.resource?.id, decodedJwt]);

  useEffect(() => {
    const loadIntl = async () => {
      setIntl(await createIntl(decodedJwt?.locale || 'en'));
    };

    loadIntl();
  }, [decodedJwt?.locale]);

  if (!isLoaded || !intl) {
    return null;
  }

  return (
    <CurrentResourceContextProvider value={resourceContext}>
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools />
        <RawIntlProvider value={intl}>
          <Grommet theme={theme} style={{ height: '100%' }}>
            <ErrorBoundary
              fallbackRender={({ error }: { error: Error }) => (
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
