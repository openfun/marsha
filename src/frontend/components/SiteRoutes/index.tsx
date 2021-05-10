import { Box, Heading } from 'grommet';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import { appData } from '../../data/appData';
import { BreadCrumbs, BreadCrumbsProvider } from '../BreadCrumbs';
import { OrganizationView } from '../OrganizationView';
import { SiteLayout } from '../SiteLayout';
import { UploadManager } from '../UploadManager';
import { UploadsView } from '../UploadsView';

const queryClient = new QueryClient();

const Wrappers = ({ children }: React.PropsWithChildren<{}>) => (
  <BrowserRouter basename="/site">
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

export const Routes = () => {
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
