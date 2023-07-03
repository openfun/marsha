import { Box, BoxProps } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { Nullable, theme } from 'lib-common';
import React, {
  CSSProperties,
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';

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
  initialWidthRatio: number,
  container: React.MutableRefObject<Nullable<HTMLDivElement>>,
  minRatio: number,
  maxRatio: number,
) => {
  const [panelWidthPx, setPanelWidthPx] = useState(0);
  const [isResizing, setIsResizing] = useState(false);

  const bounds = useRef<Nullable<{ min: number; max: number }>>(null);
  const isWidthInit = useRef(false);

  const computeWidth = useCallback((value: number) => {
    if (!bounds.current) {
      return;
    }

    return Math.min(bounds.current.max, Math.max(bounds.current.min, value));
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
                  (moveEvent.clientX - containerElement.offsetLeft);
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
    [container, computeWidth],
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
      if (!container.current || container.current.offsetWidth === 0) {
        return;
      }
      const containerElement = container.current;

      bounds.current = {
        min: containerElement.offsetWidth * minRatio,
        max: containerElement.offsetWidth * maxRatio,
      };

      if (!isWidthInit.current) {
        setPanelWidthPx(
          (currentWidth) =>
            computeWidth(containerElement.offsetWidth * initialWidthRatio) ||
            currentWidth,
        );
        isWidthInit.current = true;
      } else {
        setPanelWidthPx(
          (currentWidth) => computeWidth(currentWidth) || currentWidth,
        );
      }
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
  }, [container, initialWidthRatio, minRatio, maxRatio, computeWidth]);

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
