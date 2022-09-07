import React from 'react';

import SVGIcon, { SvgProps } from '.';

export const BinSVG = (svgProps: SvgProps) => {
  return (
    <SVGIcon viewBox={{ x: 0, y: 0, width: 14, height: 18 }} {...svgProps}>
      <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g transform="translate(-5, -3)">
          <path d="M6,19 C6,20.1 6.9,21 8,21 L16,21 C17.1,21 18,20.1 18,19 L18,9 C18,7.9 17.1,7 16,7 L8,7 C6.9,7 6,7.9 6,9 L6,19 Z M9,9 L15,9 C15.55,9 16,9.45 16,10 L16,18 C16,18.55 15.55,19 15,19 L9,19 C8.45,19 8,18.55 8,18 L8,10 C8,9.45 8.45,9 9,9 Z M15.5,4 L14.79,3.29 C14.61,3.11 14.35,3 14.09,3 L9.91,3 C9.65,3 9.39,3.11 9.21,3.29 L8.5,4 L6,4 C5.45,4 5,4.45 5,5 C5,5.55 5.45,6 6,6 L18,6 C18.55,6 19,5.55 19,5 C19,4.45 18.55,4 18,4 L15.5,4 Z" />
        </g>
      </g>
    </SVGIcon>
  );
};
