import React from 'react';

import SVGIcon, { SvgProps } from '.';

interface JoinDiscussionSVGProps extends SvgProps {
  title: string;
}

export const JoinDiscussionSVG = ({
  baseColor,
  height,
  hoverColor,
  title,
  width,
}: JoinDiscussionSVGProps) => {
  return (
    <SVGIcon
      baseColor={baseColor}
      height={height}
      hoverColor={hoverColor}
      title={title}
      viewBox={'0 0 16 20'}
      width={width}
    >
      <g fill="none" fillRule="evenodd" stroke="none" strokeWidth="1">
        <g transform="translate(-378 -986)">
          <g transform="translate(50 691)">
            <path
              d="M19.916 15.333A6.665 6.665 0 0113.25 22a6.643 6.643 0 01-6.167-4.183l-2.525-6.342a.833.833 0 011.033-1.1l.659.217c.466.15.85.508 1.033.966l1.067 2.675a.411.411 0 00.383.267h.35V4.708a1.042 1.042 0 012.083 0v6.875c0 .234.184.417.417.417a.413.413 0 00.417-.417V3.042a1.042 1.042 0 012.083 0v8.541c0 .234.183.417.417.417a.413.413 0 00.416-.417V4.292a1.042 1.042 0 012.084 0v7.291c0 .234.183.417.416.417a.413.413 0 00.417-.417V6.792a1.042 1.042 0 012.083 0v8.541z"
              transform="translate(324 293)"
            ></path>
          </g>
        </g>
      </g>
    </SVGIcon>
  );
};
