import React from 'react';

import SVGIcon, { SvgProps } from '.';

export const ValidSVG = (svgProps: SvgProps) => {
  return (
    <SVGIcon viewBox={{ x: 0, y: 0, width: 20, height: 20 }} {...svgProps}>
      <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <path d="M10,0 C4.48,0 0,4.48 0,10 C0,15.52 4.48,20 10,20 C15.52,20 20,15.52 20,10 C20,4.48 15.52,0 10,0 Z M10,18 C5.59,18 2,14.41 2,10 C2,5.59 5.59,2 10,2 C14.41,2 18,5.59 18,10 C18,14.41 14.41,18 10,18 Z M13.88,6.29 L8,12.17 L6.12,10.29 C5.73,9.9 5.1,9.9 4.71,10.29 C4.32,10.68 4.32,11.31 4.71,11.7 L7.3,14.29 C7.69,14.68 8.32,14.68 8.71,14.29 L15.3,7.7 C15.69,7.31 15.69,6.68 15.3,6.29 C14.91,5.9 14.27,5.9 13.88,6.29 Z" />
      </g>
    </SVGIcon>
  );
};
