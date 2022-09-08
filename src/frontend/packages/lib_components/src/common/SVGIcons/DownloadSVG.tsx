import React from 'react';

import SVGIcon, { SvgProps } from '.';

export const DownloadSVG = (svgProps: SvgProps) => {
  return (
    <SVGIcon viewBox={{ x: 0, y: 0, width: 24, height: 24 }} {...svgProps}>
      <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <path d="M16.59,10 L15,10 L15,5 C15,4.45 14.55,4 14,4 L10,4 C9.45,4 9,4.45 9,5 L9,10 L7.41,10 C6.52,10 6.07,11.08 6.7,11.71 L11.29,16.3 C11.68,16.69 12.31,16.69 12.7,16.3 L17.29,11.71 C17.92,11.08 17.48,10 16.59,10 Z M5,20 C5,20.55 5.45,21 6,21 L18,21 C18.55,21 19,20.55 19,20 C19,19.45 18.55,19 18,19 L6,19 C5.45,19 5,19.45 5,20 Z" />
      </g>
    </SVGIcon>
  );
};
