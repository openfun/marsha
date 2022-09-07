import React from 'react';

import SVGIcon, { SvgProps } from '.';

export const CameraOffSVG = (svgProps: SvgProps) => {
  return (
    <SVGIcon viewBox={{ x: 0, y: 0, width: 19, height: 19 }} {...svgProps}>
      <g fill="none" fillRule="evenodd" stroke="none" strokeWidth="1">
        <path d="M18.582 11.932v-5.29c0-.89-1.08-1.34-1.71-.71l-2.29 2.3v-3.5c0-.55-.45-1-1-1h-5.61l8.91 8.91c.62.63 1.7.18 1.7-.71zM.293.292a.996.996 0 000 1.41l2.02 2.03h-.73c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.55-.18l2.48 2.48a.996.996 0 101.41-1.41L1.703.293a.996.996 0 00-1.41 0z" />
      </g>
    </SVGIcon>
  );
};
