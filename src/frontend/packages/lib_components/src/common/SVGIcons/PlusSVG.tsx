import React from 'react';

import SVGIcon, { SvgProps } from '.';

export const PlusSVG = (svgProps: SvgProps) => {
  return (
    <SVGIcon viewBox={{ x: 0, y: 0, width: 20, height: 20 }} {...svgProps}>
      <g fill="none" fillRule="evenodd" stroke="none" strokeWidth="1">
        <g fill={svgProps.iconColor}>
          <path d="M10,0 C4.48,0 0,4.48 0,10 C0,15.52 4.48,20 10,20 C15.52,20 20,15.52 20,10 C20,4.48 15.52,0 10,0 Z M14,11 L11,11 L11,14 C11,14.55 10.55,15 10,15 C9.45,15 9,14.55 9,14 L9,11 L6,11 C5.45,11 5,10.55 5,10 C5,9.45 5.45,9 6,9 L9,9 L9,6 C9,5.45 9.45,5 10,5 C10.55,5 11,5.45 11,6 L11,9 L14,9 C14.55,9 15,9.45 15,10 C15,10.55 14.55,11 14,11 Z" />
        </g>
      </g>
    </SVGIcon>
  );
};
