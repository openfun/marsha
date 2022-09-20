import { Box } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import React from 'react';
import styled from 'styled-components';

const colorMenu = normalizeColor('blue-active', theme);

const MainLayoutBox = styled(Box)`
  color: ${colorMenu};
`;

interface MainLayoutProps {
  children: React.ReactNode;
  menu: React.ReactNode;
}

function MainLayout({ children, menu }: MainLayoutProps) {
  return (
    <MainLayoutBox direction="row" height={{ min: '100vh' }}>
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
