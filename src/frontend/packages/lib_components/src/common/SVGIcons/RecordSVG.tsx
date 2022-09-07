import React from 'react';

import SVGIcon, { SvgProps } from '.';

export const RecordSVG = (svgProps: SvgProps) => {
  return (
    <SVGIcon viewBox={{ x: 0, y: 0, width: 18, height: 18 }} {...svgProps}>
      <g fill="none" fillRule="evenodd" stroke="none" strokeWidth="1">
        <g fillRule="nonzero" transform="translate(-3 -3)">
          <path d="M12 3c4.968 0 9 4.032 9 9s-4.032 9-9 9-9-4.032-9-9 4.032-9 9-9zm0 1.8A7.198 7.198 0 004.8 12c0 3.978 3.222 7.2 7.2 7.2s7.2-3.222 7.2-7.2-3.222-7.2-7.2-7.2zm0 2.7a4.5 4.5 0 110 9 4.5 4.5 0 010-9z" />
        </g>
      </g>
    </SVGIcon>
  );
};
