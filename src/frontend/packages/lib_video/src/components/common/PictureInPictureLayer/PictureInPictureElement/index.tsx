import { colorsTokens } from '@lib-common/cunningham';
import { Stack } from 'grommet';
import { Box, BoxProps } from 'lib-components';
import { PropsWithChildren, ReactNode, forwardRef } from 'react';

import { startDraggingHandler } from '../usePIPDragger';

import { ResizerCorner } from './ResizerCorner';

interface PictureInPictureElementProps extends BoxProps<'div'> {
  isPicture?: boolean;
  pictureLayer?: ReactNode;
  startResizing?: startDraggingHandler;
}

const PictureInPictureElement = forwardRef<
  HTMLElement,
  PropsWithChildren<PictureInPictureElementProps>
>(({ children, id, isPicture, pictureLayer, startResizing, ...props }, ref) => {
  return (
    <Box
      data-testid={id}
      ref={ref}
      id={id}
      background={isPicture ? 'white' : undefined}
      round={isPicture ? 'small' : undefined}
      {...props}
      style={{
        border: isPicture ? `1px solid ${colorsTokens['info-500']}` : undefined,
        ...props.style,
      }}
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
});

PictureInPictureElement.displayName = 'PictureInPictureElement';
export { PictureInPictureElement };
