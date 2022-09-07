import React from 'react';

import SVGIcon, { SvgProps } from '.';

export const CameraOnSVG = (svgProps: SvgProps) => {
  return (
    <SVGIcon viewBox={{ x: 0, y: 0, width: 18, height: 12 }} {...svgProps}>
      <g fill="none" fillRule="evenodd" stroke="none" strokeWidth="1">
        <path d="M14 4.5V1c0-.55-.45-1-1-1H1C.45 0 0 .45 0 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V7.5l2.29 2.29c.63.63 1.71.18 1.71-.71V2.91c0-.89-1.08-1.34-1.71-.71L14 4.5z" />
      </g>
    </SVGIcon>
  );
};
