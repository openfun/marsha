import React from 'react';

import SVGIcon, { SvgProps } from '.';

export const OpenClosePanelSVG = (svgProps: SvgProps) => {
  return (
    <SVGIcon viewBox={{ x: 0, y: 0, width: 26, height: 26 }} {...svgProps}>
      <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g transform="translate(13, 13) rotate(-180) translate(-1262, -1010) translate(1249, 997)">
          <rect x="0" y="0" width="26" height="26" rx="4" fill="#055FD2" />
          <g transform="translate(3.450915, 3)">
            <path d="M7.74375,5.24480181 C7.41875,5.56980181 7.41875,6.09480181 7.74375,6.41980181 L10.9770833,9.65313515 L7.74375,12.8864685 C7.41875,13.2114685 7.41875,13.7364685 7.74375,14.0614685 C8.06875,14.3864685 8.59375,14.3864685 8.91875,14.0614685 L12.74375,10.2364685 C13.06875,9.91146848 13.06875,9.38646848 12.74375,9.06146848 L8.91875,5.23646848 C8.60208333,4.91980181 8.06875,4.91980181 7.74375,5.24480181 Z" />
          </g>
        </g>
      </g>
    </SVGIcon>
  );
};
