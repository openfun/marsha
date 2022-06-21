import { Box, BoxProps, Stack } from 'grommet';
import React, {
  CSSProperties,
  Fragment,
  MutableRefObject,
  ReactNode,
  useState,
} from 'react';
import styled from 'styled-components';

import { startDraggingHandler } from 'components/PictureInPictureLayer/usePIPDragger';
import { Nullable } from 'utils/types';

import { ResizerCorner } from './ResizerCorner';

const DragLayer = styled(Box)`
  cursor: move;
`;

interface PictureInPictureElementProps extends BoxProps {
  children: ReactNode;
  containerRef?: MutableRefObject<Nullable<HTMLDivElement>>;
  id?: string;
  isPicture?: boolean;
  pictureActions?: ReactNode[];
  startDragging?: startDraggingHandler;
  startResizing?: startDraggingHandler;
  style?: CSSProperties;
}

export const PictureInPictureElement = ({
  children,
  containerRef,
  id,
  isPicture,
  pictureActions,
  startDragging,
  startResizing,
  style,
}: PictureInPictureElementProps) => {
  const [isHover, setIsHover] = useState(false);

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
        <Fragment>
          <DragLayer
            fill
            onMouseDown={startDragging}
            hidden={!isPicture}
            onMouseOver={() => setIsHover(true)}
            onMouseLeave={() => setIsHover(false)}
            animation={
              isHover
                ? { type: 'fadeIn', duration: 350 }
                : { type: 'fadeOut', duration: 350, delay: 1800 }
            }
            background={
              pictureActions && pictureActions.length > 0
                ? '#0000008C'
                : 'transparent'
            }
          >
            <Box justify="between" direction="row" fill pad="small">
              {pictureActions?.map((action, index) => (
                <Box key={`pipi_action_${index}`} margin="auto">
                  {action}
                </Box>
              ))}
            </Box>
          </DragLayer>

          {isPicture && <ResizerCorner startResizing={startResizing} />}
        </Fragment>
      </Stack>
    </Box>
  );
};
