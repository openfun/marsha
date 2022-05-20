import { Box } from 'grommet';
import React, {
  CSSProperties,
  ReactNode,
  useCallback,
  useRef,
  useState,
} from 'react';

import { Nullable } from 'utils/types';

import { PictureInPictureElement } from './PictureInPictureElement';
import { usePIPDragger } from './usePIPDragger';
import { defaultmarginSize, Point } from './usePIPDragger/utils';

const pictureAnimationStyle: CSSProperties = {
  transitionProperty: 'left, top',
  transitionDuration: '0.4s',
  transitionTimingFunction: 'ease-out',
};
const containerStyle = {
  flex: '1',
  zIndex: 0,
};

interface PictureInPictureLayerProps {
  mainElement: ReactNode;
  secondElement?: ReactNode;
  reversed?: boolean;
  pictureActions?: ReactNode[];
}

export const PictureInPictureLayer = ({
  mainElement,
  secondElement = null,
  reversed: isReversed = false,
  pictureActions,
}: PictureInPictureLayerProps) => {
  //  states
  const [picturePosition, setPicturePosition] = useState<Point>({
    x: defaultmarginSize,
    y: defaultmarginSize,
  });
  const [shouldAnimate, setShouldAnimate] = useState(false);
  //  handler
  const updatePicturePosition = useCallback(
    (
      newPosition: Point | ((currentPosition: Point) => Point),
      animated: boolean,
    ) => {
      setPicturePosition(newPosition);
      setShouldAnimate(animated);
    },
    [],
  );

  const containerBoxRef = useRef<Nullable<HTMLDivElement>>(null);
  const [firstElementRef, secondElementRef, reversed, startDragging] =
    usePIPDragger(containerBoxRef.current, updatePicturePosition, isReversed);

  let pictureStyle: CSSProperties = {
    position: 'absolute',
    overflow: 'hidden',
    left: `${picturePosition.x}px`,
    top: `${picturePosition.y}px`,
    width: '20%',
    borderRadius: '6px',
    zIndex: 1,
  };
  if (shouldAnimate) {
    pictureStyle = {
      ...pictureStyle,
      ...pictureAnimationStyle,
    };
  }

  return (
    <Box ref={containerBoxRef} style={{ position: 'relative' }}>
      <PictureInPictureElement
        id="picture-in-picture-master"
        containerRef={firstElementRef}
        isPicture={reversed}
        pictureActions={reversed ? pictureActions : undefined}
        startDragging={reversed ? startDragging : undefined}
        style={reversed ? pictureStyle : containerStyle}
      >
        {mainElement}
      </PictureInPictureElement>

      {secondElement && (
        <PictureInPictureElement
          id="picture-in-picture-slave"
          containerRef={secondElementRef}
          isPicture={!reversed}
          pictureActions={!reversed ? pictureActions : undefined}
          startDragging={!reversed ? startDragging : undefined}
          style={!reversed ? pictureStyle : containerStyle}
        >
          {secondElement}
        </PictureInPictureElement>
      )}
    </Box>
  );
};
