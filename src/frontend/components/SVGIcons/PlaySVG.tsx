import React from 'react';

import SVGIcon, { SvgProps } from '.';

export const PlaySVG = (svgProps: SvgProps) => {
  return (
    <SVGIcon viewBox={{ x: 0, y: 0, width: 25, height: 25 }} {...svgProps}>
      <g fill="none" fillRule="evenodd" stroke="none" strokeWidth="1">
        <path
          fillRule="nonzero"
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM9.5 14.67V9.33c0-.79.88-1.27 1.54-.84l4.15 2.67a1 1 0 010 1.68l-4.15 2.67c-.66.43-1.54-.05-1.54-.84z"
        />
      </g>
    </SVGIcon>
  );
};
