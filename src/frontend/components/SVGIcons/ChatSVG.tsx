import React from 'react';

import SVGIcon, { SvgProps } from '.';

interface ChatSVGProps extends SvgProps {
  title: string;
}

export const ChatSVG = ({
  baseColor,
  height,
  hoverColor,
  title,
  width,
}: ChatSVGProps) => {
  return (
    <SVGIcon
      baseColor={baseColor}
      height={height}
      hoverColor={hoverColor}
      title={title}
      viewBox={'0 0 17 17'}
      width={width}
    >
      <g fill="none" fillRule="evenodd" stroke="none" strokeWidth="1">
        <g transform="translate(-378 -780)">
          <g transform="translate(50 691)">
            <path
              d="M19.3 4H5.7c-.935 0-1.692.765-1.692 1.7L4 21l3.4-3.4h11.9c.935 0 1.7-.765 1.7-1.7V5.7c0-.935-.765-1.7-1.7-1.7zM9.1 14.2H7.4v-1.7h1.7v1.7zm0-2.55H7.4v-1.7h1.7v1.7zm0-2.55H7.4V7.4h1.7v1.7zm5.1 5.1h-2.55a.852.852 0 01-.85-.85c0-.467.382-.85.85-.85h2.55c.468 0 .85.383.85.85 0 .468-.383.85-.85.85zm2.55-2.55h-5.1a.852.852 0 01-.85-.85c0-.468.382-.85.85-.85h5.1c.468 0 .85.383.85.85 0 .467-.383.85-.85.85zm0-2.55h-5.1a.852.852 0 01-.85-.85c0-.468.382-.85.85-.85h5.1c.468 0 .85.382.85.85 0 .467-.383.85-.85.85z"
              transform="translate(324 85)"
            ></path>
          </g>
        </g>
      </g>
    </SVGIcon>
  );
};
