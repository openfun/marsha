import { Anchor, Box, Grid, Nav, Sidebar } from 'grommet';
import React from 'react';

import { SiteHeader } from '../SiteHeader';
import { withLink } from '../withLink/withLink';

const SidebarLink = withLink(Anchor);

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
    <Sidebar gridArea="sidebar" background="dark-3" width="medium">
      <Nav>
        <SidebarLink
          to="/"
          margin={{ horizontal: 'medium', vertical: 'small' }}
        >
          My organization
        </SidebarLink>
      </Nav>
    </Sidebar>
    <Box gridArea="main" justify="start" align="start">
      {children}
    </Box>
  </Grid>
);
