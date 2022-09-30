import { Box } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import React from 'react';
import styled from 'styled-components';

const colorMenu = normalizeColor('blue-active', theme);

const MainLayoutBox = styled(Box)`
  color: ${colorMenu};
  min-height: 100vh;
`;

interface MainLayoutProps {
  children: React.ReactNode;
  header: React.ReactNode;
  menu: React.ReactNode;
}

function MainLayout({ children, header, menu }: MainLayoutProps) {
  return (
    <MainLayoutBox direction="row">
      {header}
      {menu}
      <Box
        flex
        background={{ color: 'bg-marsha' }}
        pad={{ vertical: 'small', horizontal: 'medium' }}
      >
        {children}
      </Box>
    </MainLayoutBox>
  );
}

export default MainLayout;
