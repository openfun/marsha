import { Box, Heading } from 'grommet';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { appData } from '../../data/appData';
import { BreadCrumbs, BreadCrumbsProvider } from '../BreadCrumbs';
import { OrganizationView } from '../OrganizationView';
import { SiteLayout } from '../SiteLayout';
import { UploadManager } from '../UploadManager';
import { UploadsView } from '../UploadsView';

const queryClient = new QueryClient();

const Wrappers = ({ children }: React.PropsWithChildren<{}>) => (
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

const SiteRoutes = () => {
  return (
    <Wrappers>
      <SiteLayout>
        <BreadCrumbs />
        <Routes>
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
        </Routes>
      </SiteLayout>
    </Wrappers>
  );
};

export default SiteRoutes;
