import { colorsTokens } from 'lib-common';
import { Box } from 'lib-components';
import React from 'react';
import styled from 'styled-components';

const StyledItemContainer = styled(Box)`
  &:hover {
    background: ${colorsTokens['primary-100']};
  }
`;

export const ViewersListItemContainer = ({
  children,
}: React.PropsWithChildren<unknown>) => (
  <StyledItemContainer
    align="center"
    justify="space-between"
    direction="row"
    gap="small"
    pad={{ horizontal: 'medium', vertical: 'xsmall' }}
  >
    {children}
  </StyledItemContainer>
);
