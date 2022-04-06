import { Box } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React from 'react';
import styled from 'styled-components';

import { theme } from 'utils/theme/theme';

const StyledItemContainer = styled(Box)`
  &:hover {
    background: ${normalizeColor('bg-marsha', theme)};
  }
`;

export const ViewersListItemContainer = ({
  children,
}: React.PropsWithChildren<{}>) => (
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
