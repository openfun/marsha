import React from 'react';

import SVGIcon, { SvgProps } from '.';

export const StopSVG = (svgProps: SvgProps) => {
  return (
    <SVGIcon viewBox={{ x: 0, y: 0, width: 18, height: 18 }} {...svgProps}>
      <g fill="none" fillRule="evenodd" stroke="none" strokeWidth="1">
        <path
          transform="translate(3 3)"
          fillRule="nonzero"
          d="M2 0h8c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H2c-1.1 0-2-.9-2-2V2C0 .9.9 0 2 0z"
        />
      </g>
    </SVGIcon>
  );
};
