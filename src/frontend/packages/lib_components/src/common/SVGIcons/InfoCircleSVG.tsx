import React from 'react';

import SVGIcon, { SvgProps } from '.';

export const InfoCircleSVG = (svgProps: SvgProps) => {
  return (
    <SVGIcon viewBox={{ x: 0, y: 0, width: 20, height: 20 }} {...svgProps}>
      <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g transform="translate(-2, -2)">
          <polygon points="0 0 24 0 24 24 0 24"></polygon>
          <path d="M12,2 C6.48,2 2,6.48 2,12 C2,17.52 6.48,22 12,22 C17.52,22 22,17.52 22,12 C22,6.48 17.52,2 12,2 Z M12,20 C7.59,20 4,16.41 4,12 C4,7.59 7.59,4 12,4 C16.41,4 20,7.59 20,12 C20,16.41 16.41,20 12,20 Z M12,17 C11.45,17 11,16.55 11,16 L11,12 C11,11.45 11.45,11 12,11 C12.55,11 13,11.45 13,12 L13,16 C13,16.55 12.55,17 12,17 Z M13,9 L11,9 L11,7 L13,7 L13,9 Z"></path>
        </g>
      </g>
    </SVGIcon>
  );
};
