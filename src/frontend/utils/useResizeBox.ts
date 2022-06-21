import { useCallback, useEffect, useRef, useState } from 'react';

export const useResizeBox = (
  initialWidth: number,
  minWidth: number,
  maxWidth: number,
) => {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);

  const initialDragPointX = useRef<number>();
  const bounds = useRef<{ min: number; max: number }>({
    min: minWidth,
    max: maxWidth,
  });

  const computeWitdth = useCallback(
    (targetWidth: number) =>
      Math.max(Math.min(bounds.current.max, targetWidth), bounds.current.min),
    [setWidth, bounds],
  );

  const mouseMove = useCallback(
    (event: MouseEvent) => {
      if (!initialDragPointX.current) {
        return;
      }

      const initialX = initialDragPointX.current;

      setWidth((currentWidth) =>
        computeWitdth(currentWidth - (initialX - event.clientX)),
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
    bounds.current = { min: minWidth, max: maxWidth };
    setWidth((currentValue) => computeWitdth(currentValue));
  }, [minWidth, maxWidth, computeWitdth]);

  return {
    width,
    isResizing,
    startResizing,
    stopResizing,
  };
};
