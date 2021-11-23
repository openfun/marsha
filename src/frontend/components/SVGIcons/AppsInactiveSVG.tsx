import React from 'react';

import SVGIcon, { SvgProps } from '.';

interface AppsInactiveSVGProps extends SvgProps {
  title: string;
}

export const AppsInactiveSVG = ({
  backgroundColor,
  baseColor,
  height,
  title,
  width,
}: AppsInactiveSVGProps) => {
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
        <g transform="translate(-1012 -681)">
          <g transform="translate(1012 681)">
            <g transform="translate(2.5 2.5)">
              <path
                fillRule="nonzero"
                d="M8.333 16.667h8.334V8.333H8.333v8.334zm12.5 25h8.334v-8.334h-8.334v8.334zm-12.5 0h8.334v-8.334H8.333v8.334zm0-12.5h8.334v-8.334H8.333v8.334zm12.5 0h8.334v-8.334h-8.334v8.334zm12.5-20.834v8.334h8.334V8.333h-8.334zm-12.5 8.334h8.334V8.333h-8.334v8.334zm12.5 12.5h8.334v-8.334h-8.334v8.334zm0 12.5h8.334v-8.334h-8.334v8.334z"
              ></path>
            </g>
          </g>
        </g>
      </g>
    </SVGIcon>
  );
};
