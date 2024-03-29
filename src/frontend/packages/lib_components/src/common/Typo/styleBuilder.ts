/* eslint-disable @typescript-eslint/ban-types */
import { themeTokens } from 'lib-common';
import { CSSProperties } from 'react';

const {
  sizes,
  '0': _0,
  xl: _xl,
  l: _l,
  b: _b,
  s: _s,
  t: _t,
  st: _st,
  bx: _bx,
  ...spacings
} = themeTokens.spacings;

type SpacingsKey = keyof typeof spacings;
export type Spacings = SpacingsKey | (string & {});

export const spacingValue = (value?: Spacings) =>
  value && value in spacings ? spacings[value as SpacingsKey] : value;

export type MarginPadding =
  | Spacings
  | {
      vertical?: Spacings;
      horizontal?: Spacings;
      top?: Spacings;
      bottom?: Spacings;
      left?: Spacings;
      right?: Spacings;
      all?: Spacings;
    };

type SizesKey = keyof typeof sizes;
export type Sizes = SizesKey | (string & {}) | (number & {});
export type SizeValue = string | (number & {}) | undefined;
export const sizesValue = (value?: Sizes): SizeValue =>
  value && value in sizes ? sizes[value as SizesKey] : value;

export type Width =
  | Sizes
  | {
      max?: Sizes;
      min?: Sizes;
      width?: Sizes;
    };

export type Height =
  | Sizes
  | {
      max?: Sizes;
      min?: Sizes;
      height?: Sizes;
    };

export const stylesTruncate = (truncate: boolean | number) => {
  // truncate with number of lines
  if (typeof truncate === 'number') {
    return {
      overflow: 'hidden',
      WebkitLineClamp: truncate,
      WebkitBoxOrient: 'vertical',
      display: '-webkit-box',
    };
  }
  return {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  };
};

export const stylesPad = (pad: MarginPadding) => {
  if (typeof pad === 'object') {
    return {
      paddingTop:
        spacingValue(pad.top) ||
        spacingValue(pad.vertical) ||
        spacingValue(pad.all),
      paddingBottom:
        spacingValue(pad.bottom) ||
        spacingValue(pad.vertical) ||
        spacingValue(pad.all),
      paddingLeft:
        spacingValue(pad.left) ||
        spacingValue(pad.horizontal) ||
        spacingValue(pad.all),
      paddingRight:
        spacingValue(pad.right) ||
        spacingValue(pad.horizontal) ||
        spacingValue(pad.all),
    };
  } else {
    return {
      padding: spacingValue(pad),
    };
  }
};

export const stylesMargin = (margin: MarginPadding) => {
  if (typeof margin === 'object') {
    return {
      marginTop:
        spacingValue(margin.top) ||
        spacingValue(margin.vertical) ||
        spacingValue(margin.all),
      marginBottom:
        spacingValue(margin.bottom) ||
        spacingValue(margin.vertical) ||
        spacingValue(margin.all),
      marginLeft:
        spacingValue(margin.left) ||
        spacingValue(margin.horizontal) ||
        spacingValue(margin.all),
      marginRight:
        spacingValue(margin.right) ||
        spacingValue(margin.horizontal) ||
        spacingValue(margin.all),
    };
  } else {
    return {
      margin: spacingValue(margin),
    };
  }
};

export const stylesWidth = (width: Width) => {
  if (typeof width === 'object') {
    return {
      maxWidth: sizesValue(width.max),
      minWidth: sizesValue(width.min),
      width: sizesValue(width.width),
    };
  } else {
    return {
      width: sizesValue(width),
    };
  }
};

export const stylesHeight = (height: Height) => {
  if (typeof height === 'object') {
    return {
      maxHeight: sizesValue(height.max),
      minHeight: sizesValue(height.min),
      height: sizesValue(height.height),
    };
  } else {
    return {
      height: sizesValue(height),
    };
  }
};

export type Flex = boolean | 'grow' | 'shrink' | (string & {}) | undefined;
export const stylesFlex = (flex: Flex, basis: CSSProperties['flexBasis']) => {
  if (flex === 'grow') {
    return {
      flexGrow: 1,
      flexShrink: 0,
      flexBasis: basis || 'auto',
    };
  } else if (flex === 'shrink') {
    return {
      flexGrow: 0,
      flexShrink: 1,
      flexBasis: basis || 'auto',
    };
  } else if (flex === true) {
    return {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: basis || 'auto',
    };
  }

  return {
    flex,
    flexBasis: basis,
  };
};
