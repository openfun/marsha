import React from 'react';
import SVGIcon, { SvgProps } from '.';

export const SendButtonSVG = (svgProps: SvgProps) => {
  return (
    <SVGIcon viewBox={'0 0 200 200'} {...svgProps}>
      <path
        d="
              M 0 130
              c 0-28 2-29 80-42
              l 55-9-65-10
              c-61-8-65-11-68-36-2-16
              1-28 6-28 21 0 167 67 165 76-3 9-147 74-164 74-5 0-9-11-9-25"
      />
    </SVGIcon>
  );
};
