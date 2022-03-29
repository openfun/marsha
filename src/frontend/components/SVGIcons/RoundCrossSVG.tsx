import React from 'react';

import SVGIcon, { SvgProps } from '.';

export const RoundCrossSVG = (svgProps: SvgProps) => {
  return (
    <SVGIcon viewBox={{ x: 0, y: 0, width: 20, height: 20 }} {...svgProps}>
      <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g transform="translate(-2, -2)">
          <path d="M12,2 C6.47,2 2,6.47 2,12 C2,17.53 6.47,22 12,22 C17.53,22 22,17.53 22,12 C22,6.47 17.53,2 12,2 Z M16.3,16.3 C15.91,16.69 15.28,16.69 14.89,16.3 L12,13.41 L9.11,16.3 C8.72,16.69 8.09,16.69 7.7,16.3 C7.31,15.91 7.31,15.28 7.7,14.89 L10.59,12 L7.7,9.11 C7.31,8.72 7.31,8.09 7.7,7.7 C8.09,7.31 8.72,7.31 9.11,7.7 L12,10.59 L14.89,7.7 C15.28,7.31 15.91,7.31 16.3,7.7 C16.69,8.09 16.69,8.72 16.3,9.11 L13.41,12 L16.3,14.89 C16.68,15.27 16.68,15.91 16.3,16.3 Z"></path>
        </g>
      </g>
    </SVGIcon>
  );
};
