import { Box, BoxProps, Stack } from 'grommet';
import { Nullable } from 'lib-common';
import React, { CSSProperties, MutableRefObject, ReactNode } from 'react';

import { startDraggingHandler } from 'components/PictureInPictureLayer/usePIPDragger';

import { ResizerCorner } from './ResizerCorner';

interface PictureInPictureElementProps extends BoxProps {
  children: ReactNode;
  containerRef?: MutableRefObject<Nullable<HTMLDivElement>>;
  id?: string;
  isPicture?: boolean;
  pictureLayer?: ReactNode;
  startResizing?: startDraggingHandler;
  style?: CSSProperties;
}

export const PictureInPictureElement = ({
  children,
  containerRef,
  id,
  isPicture,
  pictureLayer,
  startResizing,
  style,
}: PictureInPictureElementProps) => {
  return (
    <Box
      data-testid={id}
      id={id}
      ref={containerRef}
      background={isPicture ? 'white' : undefined}
      border={isPicture ? { color: 'blue-focus' } : undefined}
      round={isPicture ? 'small' : undefined}
      style={style}
    >
      <Stack
        interactiveChild={isPicture ? 'last' : 'first'}
        guidingChild="first"
        fill
      >
        {children}

        <Box fill hidden={!isPicture}>
          {pictureLayer}

          <ResizerCorner key="resize-corner" startResizing={startResizing} />
        </Box>
      </Stack>
    </Box>
  );
};
