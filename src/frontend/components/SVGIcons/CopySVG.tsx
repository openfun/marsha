import React from 'react';

import SVGIcon, { SvgProps } from '.';

export const CopySVG = (svgProps: SvgProps) => {
  return (
    <SVGIcon viewBox={{ x: 0, y: 0, width: 17, height: 20 }} {...svgProps}>
      <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g transform="translate(-4, -2)">
          <path d="M16,20 L6,20 L6,7 C6,6.45 5.55,6 5,6 C4.45,6 4,6.45 4,7 L4,20 C4,21.1 4.9,22 6,22 L16,22 C16.55,22 17,21.55 17,21 C17,20.45 16.55,20 16,20 Z M21,16 L21,4 C21,2.9 20.1,2 19,2 L10,2 C8.9,2 8,2.9 8,4 L8,16 C8,17.1 8.9,18 10,18 L19,18 C20.1,18 21,17.1 21,16 Z M19,16 L10,16 L10,4 L19,4 L19,16 Z" />
        </g>
      </g>
    </SVGIcon>
  );
};
