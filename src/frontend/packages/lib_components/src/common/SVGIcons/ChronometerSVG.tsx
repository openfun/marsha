import React from 'react';

import SVGIcon, { SvgProps } from '.';

export const ChronometerSVG = (svgProps: SvgProps) => {
  return (
    <SVGIcon viewBox={{ x: 0, y: 0, width: 24, height: 27 }} {...svgProps}>
      <g fill="none" fillRule="evenodd" stroke="none" strokeWidth="1">
        <g transform="translate(-3 -1)">
          <path
            fill={svgProps.iconColor}
            d="M17.5 1.25h-5c-.688 0-1.25.563-1.25 1.25 0 .688.563 1.25 1.25 1.25h5c.688 0 1.25-.563 1.25-1.25 0-.688-.563-1.25-1.25-1.25zM15 17.5c.688 0 1.25-.563 1.25-1.25v-5c0-.688-.563-1.25-1.25-1.25-.688 0-1.25.563-1.25 1.25v5c0 .688.563 1.25 1.25 1.25zm8.788-8.262l.937-.938a1.241 1.241 0 000-1.75l-.013-.013a1.241 1.241 0 00-1.75 0l-.937.938A11.202 11.202 0 0015 5C9 5 3.9 9.95 3.75 15.95 3.587 22.3 8.675 27.5 15 27.5c6.225 0 11.25-5.038 11.25-11.25 0-2.65-.925-5.088-2.462-7.012zM15 25a8.744 8.744 0 01-8.75-8.75A8.744 8.744 0 0115 7.5a8.744 8.744 0 018.75 8.75A8.744 8.744 0 0115 25z"
          />
        </g>
      </g>
    </SVGIcon>
  );
};
