import React from 'react';

import SVGIcon, { SvgProps } from '.';

interface ViewersActiveSVGProps extends SvgProps {
  title: string;
}

export const ViewersActiveSVG = ({
  backgroundColor,
  baseColor,
  height,
  title,
  width,
}: ViewersActiveSVGProps) => {
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
        <g transform="translate(-938 -681)">
          <g transform="translate(938 681)">
            <rect width="54" height="54" x="0" y="0" rx="6"></rect>
            <g transform="translate(2.5 2.5)">
              <path d="M25 25c3.396 0 6.396.929 8.833 2.143 2.25 1.143 3.667 3.714 3.667 6.5v1.476c0 1.31-.938 2.381-2.083 2.381H14.583c-1.146 0-2.083-1.071-2.083-2.381v-1.452c0-2.81 1.417-5.381 3.667-6.5C18.604 25.929 21.604 25 25 25zm-14.583 2.083a4.179 4.179 0 004.166-4.166 4.179 4.179 0 00-4.166-4.167 4.179 4.179 0 00-4.167 4.167 4.179 4.179 0 004.167 4.166zm2.354 2.292a14.547 14.547 0 00-2.354-.208c-2.063 0-4.021.437-5.792 1.208a4.19 4.19 0 00-2.542 3.854v1.188A2.09 2.09 0 004.167 37.5h7.291v-3.354c0-1.73.48-3.354 1.313-4.771zm26.812-2.292a4.179 4.179 0 004.167-4.166 4.179 4.179 0 00-4.167-4.167 4.179 4.179 0 00-4.166 4.167 4.179 4.179 0 004.166 4.166zm8.334 7.146c0-1.687-1-3.187-2.542-3.854a14.48 14.48 0 00-5.792-1.208c-.812 0-1.583.083-2.354.208a9.372 9.372 0 011.313 4.77V37.5h7.291a2.09 2.09 0 002.084-2.083v-1.188zM25 10.417a6.242 6.242 0 016.25 6.25 6.242 6.242 0 01-6.25 6.25 6.242 6.242 0 01-6.25-6.25 6.242 6.242 0 016.25-6.25z"></path>
            </g>
          </g>
        </g>
      </g>
    </SVGIcon>
  );
};
