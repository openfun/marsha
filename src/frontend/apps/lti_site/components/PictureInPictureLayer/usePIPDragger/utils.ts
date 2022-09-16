import { Nullable } from 'lib-common';

import { ShouldNotHappen } from 'utils/errors/exception';

export const defaultmarginSize = 40;

enum BoxCorner {
  TOP_LEFT = 'TOP_LEFT',
  TOP_RIGHT = 'TOP_RIGHT',
  BOTTOM_LEFT = 'BOTTOM_LEFT',
  BOTTOM_RIGHT = 'BOTTOM_RIGHT',
}

export interface Point {
  x: number;
  y: number;
}

export const getVelocity = (point: Point) => {
  return Math.sqrt(Math.pow(point.x, 2) + Math.pow(point.y, 2));
};

const anchorToClosestCorner = (
  container: HTMLDivElement,
  picture: HTMLDivElement,
): BoxCorner => {
  const pictureCenterPoint: Point = {
    x: picture.offsetLeft + picture.offsetWidth / 2.0,
    y: picture.offsetTop + picture.offsetHeight / 2.0,
  };

  if (
    pictureCenterPoint.x < container.offsetWidth / 2.0 &&
    pictureCenterPoint.y < container.offsetHeight / 2.0
  ) {
    return BoxCorner.TOP_LEFT;
  } else if (pictureCenterPoint.x < container.offsetWidth / 2.0) {
    return BoxCorner.BOTTOM_LEFT;
  } else if (pictureCenterPoint.y < container.offsetHeight / 2.0) {
    return BoxCorner.TOP_RIGHT;
  } else {
    return BoxCorner.BOTTOM_RIGHT;
  }
};

const anchorToDistantCorner = (velocityDescription: Point): BoxCorner => {
  if (velocityDescription.x <= 0 && velocityDescription.y <= 0) {
    return BoxCorner.TOP_LEFT;
  } else if (velocityDescription.x <= 0) {
    return BoxCorner.BOTTOM_LEFT;
  } else if (velocityDescription.y <= 0) {
    return BoxCorner.TOP_RIGHT;
  } else {
    return BoxCorner.BOTTOM_RIGHT;
  }
};

const convertCornerToPoint = (
  corner: BoxCorner,
  defaultMargin: number,
  container: HTMLDivElement,
  picture: HTMLDivElement,
): Point => {
  switch (corner) {
    case BoxCorner.TOP_LEFT:
      return {
        x: defaultMargin,
        y: defaultMargin,
      };
    case BoxCorner.BOTTOM_LEFT:
      return {
        x: defaultMargin,
        y: container.offsetHeight - picture.offsetHeight - defaultMargin,
      };
    case BoxCorner.TOP_RIGHT:
      return {
        x: container.offsetWidth - picture.offsetWidth - defaultMargin,
        y: defaultMargin,
      };
    case BoxCorner.BOTTOM_RIGHT:
      return {
        x: container.offsetWidth - picture.offsetWidth - defaultMargin,
        y: container.offsetHeight - picture.offsetHeight - defaultMargin,
      };
    default:
      throw new ShouldNotHappen(corner);
  }
};

export const computePicturePosition = (
  velocity: Nullable<Point>,
  container: HTMLDivElement,
  picture: HTMLDivElement,
  defaultMargin: number,
): Point => {
  const isVelocitySupported = velocity && (velocity.x || velocity.y);

  let targetCorner;
  if (isVelocitySupported && velocity && getVelocity(velocity) > 80) {
    targetCorner = anchorToDistantCorner(velocity);
  } else {
    targetCorner = anchorToClosestCorner(container, picture);
  }

  return convertCornerToPoint(targetCorner, defaultMargin, container, picture);
};
