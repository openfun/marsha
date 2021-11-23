import React from 'react';

import SVGIcon, { SvgProps } from '.';

export interface ViewDocInactiveSVGProps extends SvgProps {
  title: string;
}

export const ViewDocInactiveSVG = ({
  backgroundColor,
  baseColor,
  height,
  title,
  width,
}: ViewDocInactiveSVGProps) => {
  return (
    <SVGIcon
      backgroundColor={backgroundColor}
      baseColor={baseColor}
      height={height}
      title={title}
      viewBox={'0 0 54 54'}
      width={width}
    >
      <g fillRule="evenodd" stroke="none" strokeWidth="1">
        <g transform="translate(-1012 -607)">
          <g transform="translate(1012 607)">
            <g transform="translate(2.5 2.5)">
              <path
                fillRule="nonzero"
                d="M31.25 8.333a2.09 2.09 0 012.083 2.084v29.166a2.09 2.09 0 01-2.083 2.084h-25a2.09 2.09 0 01-2.083-2.084V10.417A2.09 2.09 0 016.25 8.333h25zm12.5 0a2.09 2.09 0 012.078 1.935l.005.149v29.166a2.09 2.09 0 01-1.935 2.078l-.148.006h-4.167a2.09 2.09 0 01-2.078-1.935l-.005-.149V10.417a2.09 2.09 0 011.935-2.078l.148-.006h4.167zm-26.12 7.288a1.03 1.03 0 00-1.25-1.012c-4.617 1.033-8.047 5.175-8.047 10.122 0 4.948 3.43 9.09 8.047 10.123a1.03 1.03 0 001.25-1.012zm10.154 10.143H20.77a1.054 1.054 0 00-1.043 1.044v7.034c0 .661.61 1.157 1.26 1.012 3.884-.878 6.931-3.945 7.81-7.83a1.044 1.044 0 00-1.013-1.26zm-8.057-10.143v7.034c0 .568.465 1.033 1.033 1.033h7.013c.662 0 1.157-.61 1.013-1.26a10.376 10.376 0 00-7.799-7.82 1.035 1.035 0 00-1.26 1.013z"
              ></path>
            </g>
          </g>
        </g>
      </g>
    </SVGIcon>
  );
};
