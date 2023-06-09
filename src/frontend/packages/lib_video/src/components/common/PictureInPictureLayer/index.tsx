import { Nullable } from 'lib-common';
import { StyledNoSelectElement, useResizeBox } from 'lib-components';
import React, {
  CSSProperties,
  ReactNode,
  useCallback,
  useRef,
  useState,
} from 'react';

import {
  DEFAULT_PICTURE_WIDTH_RATIO,
  MAX_PICTURE_WIDTH_RATIO,
  MIN_PICTURE_WIDTH_RATIO,
} from '@lib-video/conf/pictureInPicture';

import { PictureActionLayer } from './PictureActionLayer';
import { PictureInPictureElement } from './PictureInPictureElement';
import { PictureInPictureSwitchAction } from './PictureInPictureSwitchAction';
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
  const {
    width: pictureWidth,
    isResizing,
    startResizing,
  } = useResizeBox(
    DEFAULT_PICTURE_WIDTH_RATIO,
    MIN_PICTURE_WIDTH_RATIO,
    MAX_PICTURE_WIDTH_RATIO,
    containerBoxRef,
  );

  let pictureStyle: CSSProperties = {
    position: 'absolute',
    overflow: 'hidden',
    left: `${picturePosition.x}px`,
    top: `${picturePosition.y}px`,
    borderRadius: '6px',
    zIndex: 1,
    width: `${pictureWidth}px`,
  };
  if (shouldAnimate) {
    pictureStyle = {
      ...pictureStyle,
      ...pictureAnimationStyle,
    };
  }

  const pipSwitch: ReactNode = <PictureInPictureSwitchAction />;
  return (
    <StyledNoSelectElement
      isSelectDisable={isResizing}
      ref={containerBoxRef}
      style={{ position: 'relative' }}
    >
      <PictureInPictureElement
        id="picture-in-picture-master"
        containerRef={firstElementRef}
        isPicture={reversed}
        pictureLayer={
          <PictureActionLayer
            actions={[pipSwitch, ...(pictureActions ?? [])]}
            pictureWidth={pictureWidth}
            startDragging={startDragging}
          />
        }
        startResizing={startResizing}
        style={reversed ? pictureStyle : containerStyle}
      >
        {mainElement}
      </PictureInPictureElement>

      {secondElement && (
        <PictureInPictureElement
          id="picture-in-picture-slave"
          containerRef={secondElementRef}
          isPicture={!reversed}
          pictureLayer={
            <PictureActionLayer
              actions={[pipSwitch, ...(pictureActions ?? [])]}
              pictureWidth={pictureWidth}
              startDragging={startDragging}
            />
          }
          startResizing={startResizing}
          style={!reversed ? pictureStyle : containerStyle}
        >
          {secondElement}
        </PictureInPictureElement>
      )}
    </StyledNoSelectElement>
  );
};
