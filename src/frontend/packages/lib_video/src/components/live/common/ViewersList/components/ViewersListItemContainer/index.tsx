import { Box } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import React from 'react';
import styled from 'styled-components';

const StyledItemContainer = styled(Box)`
  &:hover {
    background: ${normalizeColor('bg-marsha', theme)};
  }
`;

export const ViewersListItemContainer = ({
  children,
}: React.PropsWithChildren<unknown>) => (
  <StyledItemContainer
    align="center"
    justify="between"
    direction="row"
    gap="small"
    pad={{ horizontal: 'medium', vertical: 'xsmall' }}
  >
    {children}
  </StyledItemContainer>
);
