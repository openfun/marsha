import { Box, Grid } from 'grommet';
import React from 'react';

import { SiteHeader } from '../SiteHeader';
import { SiteSidebar } from '../SiteSidebar';

export const SiteLayout: React.FC = ({ children }) => (
  <Grid
    fill
    rows={['auto', 'flex']}
    columns={['20%', '80%']}
    areas={[
      { name: 'header', start: [0, 0], end: [1, 0] },
      { name: 'sidebar', start: [0, 1], end: [0, 1] },
      { name: 'main', start: [1, 1], end: [1, 1] },
    ]}
  >
    <SiteHeader />
    <SiteSidebar />
    <Box gridArea="main" justify="start" align="start">
      {children}
    </Box>
  </Grid>
);
