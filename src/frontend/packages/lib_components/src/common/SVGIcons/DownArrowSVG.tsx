import React from 'react';

import SVGIcon, { SvgProps } from '.';

export const DownArrowSVG = (svgProps: SvgProps) => {
  return (
    <SVGIcon viewBox={{ x: 0, y: 0, width: 12, height: 7 }} {...svgProps}>
      <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g transform="translate(-6, -8)">
          <path
            d="M9.2925,6.29376218 C8.9025,6.68376218 8.9025,7.31376218 9.2925,7.70376218 L13.1725,11.5837622 L9.2925,15.4637622 C8.9025,15.8537622 8.9025,16.4837622 9.2925,16.8737622 C9.6825,17.2637622 10.3125,17.2637622 10.7025,16.8737622 L15.2925,12.2837622 C15.6825,11.8937622 15.6825,11.2637622 15.2925,10.8737622 L10.7025,6.28376218 C10.3225,5.90376218 9.6825,5.90376218 9.2925,6.29376218 Z"
            transform="translate(12.292500, 11.583131) scale(-1, 1) rotate(-270) translate(-12.292500, -11.583131) "
          ></path>
        </g>
      </g>
    </SVGIcon>
  );
};
