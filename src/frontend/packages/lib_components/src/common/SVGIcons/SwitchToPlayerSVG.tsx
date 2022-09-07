import React from 'react';

import SVGIcon, { SvgProps } from '.';

export const SwitchToPlayerSVG = (svgProps: SvgProps) => {
  return (
    <SVGIcon viewBox={{ x: 0, y: 0, width: 24, height: 24 }} {...svgProps}>
      <g fill="none" fillRule="evenodd" stroke="none" strokeWidth="1">
        <path
          fill="#055FD2"
          fillRule="nonzero"
          d="M8.856 1.477l4.107 4.106 1.292-1.292-1.412-1.412c4.382.376 7.893 3.841 8.324 8.204H23C22.413 4.025 15.474-.53 8.856 1.477zm.889 18.232l1.412 1.412c-4.382-.376-7.893-3.841-8.324-8.204H1c.587 7.058 7.526 11.614 14.144 9.606l-4.107-4.106-1.292 1.292z"
        />
        <path
          fill="#055FD2"
          fillRule="nonzero"
          d="M14.5 9.5c0 1.383-1.117 2.5-2.5 2.5a2.497 2.497 0 01-2.5-2.5C9.5 8.117 10.617 7 12 7s2.5 1.117 2.5 2.5zM7 16.085c0-1.829 3.333-2.835 5-2.835 1.667 0 5 1.006 5 2.835 0 .506-.41.915-.915.915h-8.17A.915.915 0 017 16.085z"
        />
      </g>
    </SVGIcon>
  );
};
