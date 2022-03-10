import { Box, Button } from 'grommet';
import React, { useEffect, useRef, useState } from 'react';

import { DoubleArrowResizerSVG } from 'components/SVGIcons/DoubleArrowResizerSVG';
import { OpenClosePanelSVG } from 'components/SVGIcons/OpenClosePanelSVG';
import { useLivePanelState } from 'data/stores/useLivePanelState/index';
import {
  MIN_PANEL_WIDTH_RATIO,
  MAX_PANEL_WIDTH_RATIO,
} from 'default/livePanel';

interface LiveVideoResizerProps {
  isReadyToDisplayRightElement: boolean;
  isPanelOpen?: boolean;
  leftElement: React.ReactElement;
  rightElement?: React.ReactElement;
  savedPanelWidthPx: number;
  setSavedPanelWidthPx: React.Dispatch<React.SetStateAction<number>>;
}

export const LiveVideoResizer = ({
  isReadyToDisplayRightElement,
  isPanelOpen,
  leftElement,
  rightElement,
  savedPanelWidthPx,
  setSavedPanelWidthPx,
}: LiveVideoResizerProps) => {
  const WINDOW_WIDTH_PX = document.documentElement.clientWidth;
  const MIN_PANEL_WIDTH_PX = MIN_PANEL_WIDTH_RATIO * WINDOW_WIDTH_PX;
  const MAX_PANEL_WIDTH_PX = MAX_PANEL_WIDTH_RATIO * WINDOW_WIDTH_PX;
  const HALF_SLIDER_WIDTH_PX = 14;

  const [panelWidthPx, setPanelWidthPx] = useState(savedPanelWidthPx);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizerVisible, setIsResizerVisible] = useState(false);
  const [mousePositionY, setMousePositionY] = useState(0);
  const [isButtonHold, setIsButtonHold] = useState(false);

  const setPanelVisibility = useLivePanelState(
    (state) => state.setPanelVisibility,
  );

  const handleOnMouseEnterSliderArea = () => {
    containerRef.current!.style.cursor = 'none';
    setIsResizerVisible(true);
  };

  const handleOnMouseLeaveSliderArea = () => {
    if (!isButtonHold) {
      containerRef.current!.style.cursor = 'auto';
      setIsResizerVisible(false);
    }
  };

  const handleOnMouseDownResizerArea = () => {
    if (isResizerVisible) {
      setIsButtonHold(true);
    }
  };

  const stopSlider = () => {
    containerRef.current!.style.cursor = 'auto';
    setIsButtonHold(false);
    setIsResizerVisible(false);
  };

  const handleResizingSliderMouseMove = (
    e: React.MouseEvent<Element, MouseEvent>,
  ) => {
    /* This part is reponsible of tracking the Y axis of the slider */
    const resizerAreaBoundingRect =
      containerRef.current!.getBoundingClientRect();

    if (
      (containerRef.current && e.clientY - 5 < resizerAreaBoundingRect.y) ||
      e.clientY - 5 > resizerAreaBoundingRect.y + resizerAreaBoundingRect.height
    ) {
      stopSlider();
      return;
    }
    setMousePositionY(e.clientY);

    /* This part is reponsible of tracking the X axis of the slider */
    if (isButtonHold) {
      const newPanelWidthPx =
        WINDOW_WIDTH_PX - e.clientX + HALF_SLIDER_WIDTH_PX;

      if (
        newPanelWidthPx <= MIN_PANEL_WIDTH_PX - HALF_SLIDER_WIDTH_PX ||
        newPanelWidthPx >= MAX_PANEL_WIDTH_PX + HALF_SLIDER_WIDTH_PX
      ) {
        stopSlider();
        return;
      }

      setPanelWidthPx(newPanelWidthPx);
    }
  };

  const handleClickOnCloseOpenPanel = () => {
    setSavedPanelWidthPx(panelWidthPx);
    setPanelVisibility(!isPanelOpen);
  };

  // The maximum / minimum size of the panel can change if the browser window is resized
  useEffect(() => {
    if (panelWidthPx < MIN_PANEL_WIDTH_PX) {
      setPanelWidthPx(MIN_PANEL_WIDTH_PX);
    }
    if (panelWidthPx > MAX_PANEL_WIDTH_PX) {
      setPanelWidthPx(MAX_PANEL_WIDTH_PX);
    }
  });

  return (
    <Box
      direction="row"
      onDragStart={(e) => e.preventDefault()}
      onMouseDown={handleOnMouseDownResizerArea}
      onMouseLeave={() => setIsButtonHold(false)}
      onMouseMove={handleResizingSliderMouseMove}
      onMouseUp={() => setIsButtonHold(false)}
      ref={containerRef}
    >
      <Box
        fill
        style={{ pointerEvents: isResizerVisible ? 'none' : undefined }}
      >
        {leftElement}
        {!isPanelOpen && (
          <Button
            disabled={!isReadyToDisplayRightElement}
            icon={
              <OpenClosePanelSVG height="20px" iconColor="white" width="20px" />
            }
            onClick={handleClickOnCloseOpenPanel}
            style={{
              padding: '0px',
              position: 'absolute',
              right: '30px',
              top: '18px',
              zIndex: 30,
            }}
          />
        )}
      </Box>
      {isPanelOpen && isReadyToDisplayRightElement && rightElement && (
        <Box
          style={{
            minWidth: `${panelWidthPx - HALF_SLIDER_WIDTH_PX}px`,
            position: 'relative',
          }}
        >
          <Button
            icon={
              <OpenClosePanelSVG height="20px" iconColor="white" width="20px" />
            }
            onClick={handleClickOnCloseOpenPanel}
            style={{
              left: '-10px',
              padding: '0px',
              position: 'absolute',
              top: '18px',
              transform: 'rotate(180deg)',
              zIndex: 30,
            }}
          />

          <Box
            direction="row"
            height="100%"
            justify="center"
            onMouseEnter={handleOnMouseEnterSliderArea}
            onMouseLeave={handleOnMouseLeaveSliderArea}
            style={{
              left: `${-HALF_SLIDER_WIDTH_PX}px`,
              position: 'absolute',
              zIndex: 20,
            }}
            width="28px"
          />
          {isResizerVisible && (
            <React.Fragment>
              <DoubleArrowResizerSVG
                height="28px"
                iconColor="blue-focus"
                width="28px"
                containerStyle={{
                  left: `${-HALF_SLIDER_WIDTH_PX}px`,
                  position: 'absolute',
                  top: `${mousePositionY - HALF_SLIDER_WIDTH_PX}px`,
                  zIndex: 10,
                }}
              />

              <Box
                background="blue-active"
                height="100%"
                style={{ left: '-2px', position: 'absolute', zIndex: 5 }}
                width="4px"
              />
            </React.Fragment>
          )}
          {rightElement}
        </Box>
      )}
    </Box>
  );
};
