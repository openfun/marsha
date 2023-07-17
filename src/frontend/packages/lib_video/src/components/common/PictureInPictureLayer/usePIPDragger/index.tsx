import { Maybe, Nullable } from 'lib-common';
import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { Point, computePicturePosition, defaultmarginSize } from './utils';

export type startDraggingHandler = (
  event: React.MouseEvent<HTMLDivElement, MouseEvent>,
) => void;

export const usePIPDragger = (
  container: Nullable<HTMLDivElement>,
  updatePIPPosition: (
    newPosition: Point | ((currentPosition: Point) => Point),
    animated: boolean,
  ) => void,
  isReversed = false,
): [
  MutableRefObject<Nullable<HTMLDivElement>>,
  MutableRefObject<Nullable<HTMLDivElement>>,
  boolean,
  startDraggingHandler,
] => {
  const firstElementRef = useRef<Nullable<HTMLDivElement>>(null);
  const secondElementRef = useRef<Nullable<HTMLDivElement>>(null);
  const [reversed, setReversed] = useState(isReversed);

  const backgroundRef = useRef<Nullable<HTMLDivElement>>(null);
  const foregroundRef = useRef<Nullable<HTMLDivElement>>(null);

  useEffect(() => {
    if (reversed && secondElementRef.current) {
      backgroundRef.current = secondElementRef.current;
      foregroundRef.current = firstElementRef.current;
    } else {
      backgroundRef.current = firstElementRef.current;
      foregroundRef.current = secondElementRef.current;
    }
  });

  // eslint-disable-next-line
  useEffect(() => {
    if (isReversed && secondElementRef.current) {
      setReversed(true);
    } else {
      setReversed(false);
    }
  });

  const initialDragPoint = useRef<Point>();
  const velocityRef = useRef<Nullable<Point>>(null);

  const drag = useCallback(
    (event: MouseEvent) => {
      if (
        foregroundRef.current === null ||
        backgroundRef.current === null ||
        initialDragPoint.current === undefined
      ) {
        return;
      }

      const initialX = initialDragPoint.current.x;
      const initialY = initialDragPoint.current.y;

      updatePIPPosition(
        (currentValue) => ({
          x: currentValue.x - (initialX - event.clientX),
          y: currentValue.y - (initialY - event.clientY),
        }),
        false,
      );
      velocityRef.current = {
        x: event.movementX,
        y: event.movementY,
      };
      initialDragPoint.current = { x: event.clientX, y: event.clientY };
    },
    [updatePIPPosition],
  );
  const endDragging = useCallback(() => {
    document.removeEventListener('mouseup', endDragging);
    document.removeEventListener('mousemove', drag);

    if (
      foregroundRef.current === null ||
      backgroundRef.current === null ||
      initialDragPoint.current === undefined
    ) {
      return;
    }

    initialDragPoint.current = undefined;

    updatePIPPosition(
      computePicturePosition(
        velocityRef.current,
        backgroundRef.current,
        foregroundRef.current,
        defaultmarginSize,
      ),
      true,
    );
  }, [drag, updatePIPPosition]);
  const startDragging = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (foregroundRef.current === null || backgroundRef.current === null) {
        return;
      }

      initialDragPoint.current = { x: event.clientX, y: event.clientY };

      document.addEventListener('mouseup', endDragging);
      document.addEventListener('mousemove', drag);
    },
    [drag, endDragging],
  );

  //  update picture position on container resize
  useEffect(() => {
    if (!container) {
      return;
    }

    const observer = new ResizeObserver(() => {
      if (!backgroundRef.current || !foregroundRef.current) {
        return;
      }

      updatePIPPosition(
        computePicturePosition(
          velocityRef.current,
          backgroundRef.current,
          foregroundRef.current,
          defaultmarginSize,
        ),
        true,
      );
    });
    observer.observe(container);

    return () => {
      if (!container) {
        return;
      }

      observer.unobserve(container);
    };
  }, [container, updatePIPPosition]);

  useEffect(() => {
    let observedElement: Maybe<HTMLDivElement>;
    if (firstElementRef.current !== null && reversed) {
      observedElement = firstElementRef.current;
    } else if (secondElementRef.current !== null && !reversed) {
      observedElement = secondElementRef.current;
    }

    if (!observedElement) {
      return;
    }

    const observer = new ResizeObserver(() => {
      if (!backgroundRef.current || !foregroundRef.current) {
        return;
      }

      updatePIPPosition(
        computePicturePosition(
          velocityRef.current,
          backgroundRef.current,
          foregroundRef.current,
          defaultmarginSize,
        ),
        true,
      );
    });
    observer.observe(observedElement);
    return () => {
      if (!observedElement) {
        return;
      }

      observer.unobserve(observedElement);
    };
  }, [reversed, updatePIPPosition]);

  return [firstElementRef, secondElementRef, reversed, startDragging];
};
