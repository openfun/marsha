import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import React from 'react';

import SVGIcon, { SvgProps } from '.';

export const ClassroomSVG = (svgProps: SvgProps) => {
  const color = normalizeColor(svgProps.iconColor, theme);
  return (
    <SVGIcon viewBox={{ x: 0, y: 0, width: 25, height: 25 }} {...svgProps}>
      <g fill="none" fillRule="evenodd" stroke="none" strokeWidth="1">
        <path
          d="M17.9636364,4.72727273 L6.03636365,4.72727273 C5.21636364,4.72727273 4.54545455,5.39818182 4.54545455,6.21818183 L4.54545455,15.1636364 C4.54545455,15.9836364 5.21636364,16.6545455 6.03636365,16.6545455 L17.9636364,16.6545455 C18.7836365,16.6545455 19.4545455,15.9836364 19.4545455,15.1636364 L19.4545455,6.21818183 C19.4545455,5.39818182 18.7836365,4.72727273 17.9636364,4.72727273 Z M10.1363637,12.6812728 L10.1363637,8.70054548 C10.1363637,8.11163638 10.7923637,7.7538182 11.2843637,8.07436366 L14.3780001,10.0647273 C14.8327273,10.3554546 14.8327273,11.0263637 14.3780001,11.3170909 L11.2843637,13.3074546 C10.7923637,13.6280001 10.1363637,13.2701819 10.1363637,12.6812728 Z"
          id="Shape"
        />
        <rect fill={color} x="8" y="18" width="8" height="2" rx="1" />
      </g>
    </SVGIcon>
  );
};