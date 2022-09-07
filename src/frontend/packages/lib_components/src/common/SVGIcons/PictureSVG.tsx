import React from 'react';

import SVGIcon, { SvgProps } from '.';

export const PictureSVG = (svgProps: SvgProps) => {
  return (
    <SVGIcon viewBox={{ x: 0, y: 0, width: 24, height: 24 }} {...svgProps}>
      <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <path d="M19,3 C20.1,3 21,3.9 21,5 L21,5 L21,19 C21,20.1 20.1,21 19,21 L19,21 L5,21 C3.9,21 3,20.1 3,19 L3,19 L3,5 C3,3.9 3.9,3 5,3 L5,3 Z M14.9,12.53 C14.7,12.26 14.3,12.26 14.1,12.52 L14.1,12.52 L11,16.51 L8.9,13.98 C8.69,13.73 8.31,13.74 8.12,14 L8.12,14 L5.63,17.2 C5.37,17.53 5.6,18.01 6.02,18.01 L6.02,18.01 L18.01,18.01 C18.42,18.01 18.66,17.54 18.41,17.21 L18.41,17.21 Z" />
      </g>
    </SVGIcon>
  );
};
