import React from 'react';

import SVGIcon, { SvgProps } from '.';

export const DoubleArrowResizerSVG = (svgProps: SvgProps) => {
  return (
    <SVGIcon viewBox={{ x: 0, y: 0, width: 28, height: 28 }} {...svgProps}>
      <rect
        stroke="#055FD2"
        strokeWidth="2"
        fill="#4184DA"
        x="1"
        y="1"
        width="26"
        height="26"
        rx="14"
      />
      <g transform="translate(4.5, 9.8)" fill="#031963">
        <path
          d="M4.89442719,1.78885438 L8,8 L8,8 L0,8 L3.10557281,1.78885438 C3.35256206,1.29487588 3.9532351,1.09465154 4.4472136,1.34164079 C4.640741,1.43840449 4.79766349,1.59532698 4.89442719,1.78885438 Z"
          transform="translate(3.75, 4) rotate(-90) scale(1.1, 1.1) translate(-4, -4)"
        />
        <path
          d="M15.8944272,1.78885438 L19,8 L19,8 L11,8 L14.1055728,1.78885438 C14.3525621,1.29487588 14.9532351,1.09465154 15.4472136,1.34164079 C15.640741,1.43840449 15.7976635,1.59532698 15.8944272,1.78885438 Z"
          transform="translate(15.25, 4) scale(-1.1, 1.1) rotate(-90) translate(-15, -4)"
        />
      </g>
    </SVGIcon>
  );
};
