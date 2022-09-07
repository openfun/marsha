import { Box, Stack } from 'grommet';
import React, { CSSProperties } from 'react';
import styled from 'styled-components';

import { startDraggingHandler } from 'components/PictureInPictureLayer/usePIPDragger';

const StyledContainer = styled(Box)`
  cursor: se-resize;
  position: absolute;
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
    >
      <Stack fill style={{ overflow: 'hidden' }}>
        <Box
          background="blue-active"
          width="100%"
          height="2px"
          margin={{ top: '10px' }}
          style={{ transform: 'rotate(-45deg) scaleX(1.5)' }}
        />

        <Box
          width="0px"
          height="0px"
          border={[
            {
              color: 'blue-active',
              size: '10px',
              style: 'solid',
              side: 'bottom',
            },
            { color: 'transparent', size: '10px', style: 'solid', side: 'top' },
            {
              color: 'transparent',
              size: '10px',
              style: 'solid',
              side: 'left',
            },
            {
              color: 'transparent',
              size: '10px',
              style: 'solid',
              side: 'right',
            },
          ]}
          margin={{ top: '10px', left: '10px' }}
          style={{ transform: 'rotate(135deg)' }}
        />
      </Stack>
    </StyledContainer>
  );
};
