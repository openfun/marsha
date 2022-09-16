import { Nullable } from 'lib-common';
import React, { useCallback, useEffect, useRef, useState } from 'react';

export const useResizeBox = (
  initialWidthRatio: number,
  minWidthRatio: number,
  maxWidthRatio: number,
  container: React.MutableRefObject<Nullable<HTMLDivElement>>,
) => {
  const [width, setWidth] = useState(0);
  const [isResizing, setIsResizing] = useState(false);

  const initialDragPointX = useRef<number>();
  const bounds = useRef<Nullable<{ min: number; max: number }>>(null);
  const isWidthInit = useRef(false);

  const computeWitdth = useCallback(
    (targetWidth: number) => {
      if (!bounds.current) {
        return null;
      }

      return Math.max(
        Math.min(bounds.current.max, targetWidth),
        bounds.current.min,
      );
    },
    [setWidth, bounds],
  );

  const mouseMove = useCallback(
    (event: MouseEvent) => {
      if (!initialDragPointX.current) {
        return;
      }

      const initialX = initialDragPointX.current;

      setWidth(
        (currentWidth) =>
          computeWitdth(currentWidth - (initialX - event.clientX)) ||
          currentWidth,
      );
      initialDragPointX.current = event.clientX;
    },
    [computeWitdth],
  );
  const stopResizing = useCallback(() => {
    setIsResizing(false);
    initialDragPointX.current = undefined;

    document.body.style.cursor = 'auto';
    document.body.onmousemove = null;
    document.body.onmouseup = null;
  }, []);
  const startResizing = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      setIsResizing(true);
      initialDragPointX.current = event.clientX;

      document.body.style.cursor = 'se-resize';
      document.body.onmousemove = mouseMove;
      document.body.onmouseup = stopResizing;
    },
    [mouseMove, stopResizing],
  );

  useEffect(() => {
    return () => {
      if (isResizing) {
        document.body.style.cursor = 'auto';
        document.body.onmousemove = null;
        document.body.onmouseup = null;
      }
    };
  }, [isResizing]);

  useEffect(() => {
    if (!container.current) {
      return;
    }

    const computeBounds = () => {
      if (!container.current || container.current.offsetWidth === 0) {
        return;
      }

      const containerWidth = container.current.offsetWidth;
      bounds.current = {
        min: containerWidth * minWidthRatio,
        max: containerWidth * maxWidthRatio,
      };

      if (isWidthInit.current) {
        setWidth((currentValue) => computeWitdth(currentValue) || currentValue);
      } else {
        setWidth(
          (currentValue) =>
            computeWitdth(containerWidth * initialWidthRatio) || currentValue,
        );
        isWidthInit.current = true;
      }
    };

    const observer = new ResizeObserver(computeBounds);

    const containerElement = container.current;
    observer.observe(containerElement);

    computeBounds();
    return () => {
      observer.unobserve(containerElement);
    };
  }, [container, minWidthRatio, maxWidthRatio]);

  return {
    width,
    isResizing,
    startResizing,
    stopResizing,
  };
};
