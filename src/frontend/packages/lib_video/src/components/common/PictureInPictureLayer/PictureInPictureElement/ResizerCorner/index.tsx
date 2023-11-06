import { colorsTokens } from '@lib-common/cunningham';
import { Stack } from 'grommet';
import { Box } from 'lib-components';
import React, { CSSProperties } from 'react';
import styled from 'styled-components';

import { startDraggingHandler } from '../../usePIPDragger';

const StyledContainer = styled(Box)`
  cursor: se-resize;
  bottom: -10px;
  right: -10px;
  z-index: 10;
`;

interface ResizerCornerProps {
  startResizing?: startDraggingHandler;
  style?: CSSProperties;
}

export const ResizerCorner = ({ startResizing, style }: ResizerCornerProps) => {
  return (
    <StyledContainer
      data-testid="corner-resizer"
      height="30px"
      width="30px"
      style={style}
      pad={{ bottom: '10px', right: '10px' }}
      onMouseDown={startResizing}
      position="absolute"
    >
      <Stack fill style={{ overflow: 'hidden' }}>
        <Box
          background={colorsTokens['info-500']}
          width="100%"
          height="2px"
          margin={{ top: '10px' }}
          style={{ transform: 'rotate(-45deg) scaleX(1.5)' }}
        />

        <Box
          width="0px"
          height="0px"
          margin={{ top: '10px', left: '10px' }}
          style={{
            transform: 'rotate(135deg)',
            border: '10px solid transparent',
            borderBottomColor: colorsTokens['info-500'],
          }}
        />
      </Stack>
    </StyledContainer>
  );
};
