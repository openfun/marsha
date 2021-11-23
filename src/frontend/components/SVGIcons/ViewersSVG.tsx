import React from 'react';

import SVGIcon, { SvgProps } from '.';

interface ViewersSVGprops extends SvgProps {
  title: string;
}

export const ViewersSVG = ({
  baseColor,
  height,
  hoverColor,
  title,
  width,
}: ViewersSVGprops) => {
  return (
    <SVGIcon
      baseColor={baseColor}
      height={height}
      hoverColor={hoverColor}
      title={title}
      viewBox={'0 0 22 13'}
      width={width}
    >
      <g fill="none" fillRule="evenodd" stroke="none" strokeWidth="1">
        <g transform="translate(-645 -927)">
          <g transform="translate(50 691)">
            <g transform="translate(594 231)">
              <path d="M12 12c1.63 0 3.07.446 4.24 1.029 1.08.548 1.76 1.782 1.76 3.12v.708c0 .629-.45 1.143-1 1.143H7c-.55 0-1-.514-1-1.143v-.697c0-1.349.68-2.583 1.76-3.12A9.355 9.355 0 0112 12zm-7 1c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm1.13 1.1c-.37-.06-.74-.1-1.13-.1-.99 0-1.93.21-2.78.58A2.01 2.01 0 001 16.43V17c0 .55.45 1 1 1h3.5v-1.61c0-.83.23-1.61.63-2.29zM19 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4 3.43c0-.81-.48-1.53-1.22-1.85A6.95 6.95 0 0019 14c-.39 0-.76.04-1.13.1.4.68.63 1.46.63 2.29V18H22c.55 0 1-.45 1-1v-.57zM12 5c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"></path>
            </g>
          </g>
        </g>
      </g>
    </SVGIcon>
  );
};
