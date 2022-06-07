import React from 'react';

import SVGIcon, { SvgProps } from '.';

export const MicrophoneOnSVG = (svgProps: SvgProps) => {
  return (
    <SVGIcon viewBox={{ x: 0, y: 0, width: 14, height: 19 }} {...svgProps}>
      <g fill="none" fillRule="evenodd" stroke="none" strokeWidth="1">
        <path d="M6.92 12c1.66 0 3-1.34 3-3V3c0-1.66-1.34-3-3-3s-3 1.34-3 3v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C11.44 12.2 9.39 14 6.92 14c-2.47 0-4.52-1.8-4.93-4.15A.998.998 0 001.01 9c-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V18c0 .55.45 1 1 1s1-.45 1-1v-2.08a6.993 6.993 0 005.91-5.78c.1-.6-.39-1.14-1-1.14z" />
      </g>
    </SVGIcon>
  );
};
