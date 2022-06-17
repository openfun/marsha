import { Box, BoxProps } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React, {
  CSSProperties,
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';

import {
  MIN_PANEL_WIDTH_RATIO,
  MAX_PANEL_WIDTH_RATIO,
} from 'default/livePanel';
import { Nullable } from 'utils/types';
import { theme } from 'utils/theme/theme';

const HALF_SLIDER_WIDTH_PX = 14;

const StyledResizeSeparator = styled(Box)`
  left: ${-HALF_SLIDER_WIDTH_PX}px;
  position: absolute;
  z-index: 20;
  cursor: col-resize;

  &:hover div {
    background-color: ${normalizeColor('blue-active', theme)};
  }
`;

export const useResizer = (
  initialWidth: number,
  container: React.MutableRefObject<Nullable<HTMLDivElement>>,
) => {
  const [panelWidthPx, setPanelWidthPx] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);

  const minWidthValue = useRef<Nullable<number>>(null);
  const maxWidthValue = useRef<Nullable<number>>(null);

  const computeWidth = useCallback((value: number) => {
    if (!minWidthValue.current || !maxWidthValue.current) {
      return;
    }

    return Math.min(
      maxWidthValue.current,
      Math.max(minWidthValue.current, value),
    );
  }, []);

  const ResizableElementContainer = useCallback(
    ({
      children,
      isResizeHandle,
      style,
      ...boxProps
    }: PropsWithChildren<
      BoxProps & { isResizeHandle: boolean; style: CSSProperties }
    >) => (
      <Box {...boxProps} style={{ position: 'relative', ...style }}>
        {isResizeHandle && (
          <StyledResizeSeparator
            direction="row"
            height="100%"
            justify="center"
            onMouseDown={(event) => {
              event.preventDefault();

              if (!container.current) {
                return;
              }
              const containerElement = container.current;

              setIsResizing(true);

              containerElement.onmousemove = (moveEvent) => {
                moveEvent.preventDefault();

                const newPanelWidthPx =
                  containerElement.offsetWidth -
                  containerElement.offsetLeft -
                  moveEvent.clientX;
                const newValue = computeWidth(newPanelWidthPx);
                if (newValue) {
                  setPanelWidthPx(newValue);
                }
              };

              document.onmouseup = () => {
                setIsResizing(false);
                document.onmouseup = null;
                containerElement.onmousemove = null;
              };
            }}
            width="28px"
          >
            <Box height="100%" margin="auto" width="4px" />
          </StyledResizeSeparator>
        )}
        {children}
      </Box>
    ),
    [container],
  );

  useEffect(() => {
    if (!container.current) {
      return;
    }
    const containerElement = container.current;

    containerElement.ondragstart = (event) => event.preventDefault();
    return () => {
      containerElement.ondragstart = null;
    };
  }, [container]);

  useEffect(() => {
    const computeBounds = () => {
      if (!container.current) {
        return;
      }
      const containerElement = container.current;

      minWidthValue.current =
        containerElement.offsetWidth * MIN_PANEL_WIDTH_RATIO;
      maxWidthValue.current =
        containerElement.offsetWidth * MAX_PANEL_WIDTH_RATIO;

      setPanelWidthPx(
        (currentWidth) => computeWidth(currentWidth) || currentWidth,
      );
    };

    if (!container.current) {
      return;
    }
    const observedElement = container.current;

    const observer = new ResizeObserver(computeBounds);
    observer.observe(observedElement);

    computeBounds();
    return () => {
      observer.unobserve(observedElement);
    };
  }, [container]);

  useEffect(() => {
    if (isResizing) {
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [isResizing]);

  return {
    width: panelWidthPx,
    isResizing,
    ResizableContainer: ResizableElementContainer,
  };
};
