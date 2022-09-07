import { Box, Heading } from 'grommet';
import { BreadCrumbs } from 'lib-components';
import { BreadCrumbsProvider } from 'lib-common';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import { OrganizationView } from 'components/OrganizationView';
import { SiteLayout } from 'components/SiteLayout';
import { UploadManager } from 'components/UploadManager';
import { UploadsView } from 'components/UploadsView';
import { useAppConfig } from 'data/stores/useAppConfig';

const queryClient = new QueryClient();

const Wrappers = ({ children }: React.PropsWithChildren<{}>) => {
  const appData = useAppConfig();

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <BreadCrumbsProvider>
          <UploadManager>
            <div
              style={{ width: '100%', height: '100%' }}
              className={`marsha-${appData.frontend}`}
            >
              {children}
            </div>
          </UploadManager>
        </BreadCrumbsProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

const Routes = () => {
  return (
    <Wrappers>
      <SiteLayout>
        <BreadCrumbs />
        <Switch>
          <Route path={'/uploads'}>
            <UploadsView />
          </Route>

          <Route path={'/organization/:organizationId'}>
            <OrganizationView />
          </Route>

          <Route>
            <Box>
              <Heading margin="medium">The main content</Heading>
            </Box>
          </Route>
        </Switch>
      </SiteLayout>
    </Wrappers>
  );
};

export default Routes;
