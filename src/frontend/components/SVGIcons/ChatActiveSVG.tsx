import React from 'react';

import SVGIcon, { SvgProps } from '.';

interface ChatActiveSVGProps extends SvgProps {
  title: string;
}

export const ChatActiveSVG = ({
  backgroundColor,
  baseColor,
  height,
  title,
  width,
}: ChatActiveSVGProps) => {
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
        <g transform="translate(-864 -681)">
          <g transform="translate(864 681)">
            <rect width="54" height="54" x="0" y="0" rx="6"></rect>
            <g fill="#FFF" transform="translate(2.5 2.5)">
              <path d="M40.208 8.333H11.875c-1.948 0-3.524 1.594-3.524 3.542L8.333 43.75l7.084-7.083h24.791a3.552 3.552 0 003.542-3.542v-21.25a3.552 3.552 0 00-3.542-3.542zm-21.25 21.25h-3.541v-3.541h3.541v3.541zm0-5.312h-3.541v-3.542h3.541v3.542zm0-5.313h-3.541v-3.541h3.541v3.541zm10.625 10.625h-5.312c-.974 0-1.771-.797-1.771-1.77 0-.974.797-1.771 1.77-1.771h5.313c.974 0 1.771.797 1.771 1.77 0 .974-.797 1.771-1.77 1.771zm5.313-5.312H24.27c-.974 0-1.771-.797-1.771-1.771 0-.974.797-1.77 1.77-1.77h10.626c.974 0 1.77.796 1.77 1.77s-.796 1.77-1.77 1.77zm0-5.313H24.27c-.974 0-1.771-.797-1.771-1.77 0-.974.797-1.771 1.77-1.771h10.626c.974 0 1.77.797 1.77 1.77 0 .974-.796 1.771-1.77 1.771z"></path>
            </g>
          </g>
        </g>
      </g>
    </SVGIcon>
  );
};
