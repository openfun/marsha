import { Anchor, Box, Button, Grid, Header, Nav, Sidebar, Text } from 'grommet';
import React from 'react';

import { withLink } from '../withLink/withLink';

const TitleLink = withLink(Anchor);

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
    <Header
      gridArea="header"
      direction="row"
      align="center"
      justify="between"
      pad={{ horizontal: 'medium', vertical: 'small' }}
      background="dark-2"
    >
      <TitleLink to="/" size="large" color="white">
        marsha.education
      </TitleLink>
      <Text>user@example.com</Text>
    </Header>
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
