import React from 'react';

import SVGIcon, { SvgProps } from '.';

export const DownloadSVG = (svgProps: SvgProps) => {
  return (
    <SVGIcon viewBox={{ x: 0, y: 0, width: 14, height: 17 }} {...svgProps}>
      <g fillRule="evenodd" stroke="none" strokeWidth="1">
        <g transform="translate(-5 -4)">
          <path d="M16.59 10H15V5c0-.55-.45-1-1-1h-4c-.55 0-1 .45-1 1v5H7.41c-.89 0-1.34 1.08-.71 1.71l4.59 4.59c.39.39 1.02.39 1.41 0l4.59-4.59c.63-.63.19-1.71-.7-1.71zM5 20c0 .55.45 1 1 1h12c.55 0 1-.45 1-1s-.45-1-1-1H6c-.55 0-1 .45-1 1z" />
        </g>
      </g>
    </SVGIcon>
  );
};
