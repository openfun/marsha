import React from 'react';

import SVGIcon, { SvgProps } from '.';

interface WaitingJoinDiscussionSVGProps extends SvgProps {
  title: string;
}

export const WaitingJoinDiscussionSVG = ({
  backgroundColor,
  baseColor,
  height,
  title,
  width,
}: WaitingJoinDiscussionSVGProps) => {
  return (
    <SVGIcon
      backgroundColor={backgroundColor}
      baseColor={baseColor}
      height={height}
      title={title}
      viewBox={'0 0 37 37'}
      width={width}
    >
      <g fillRule="evenodd" stroke="none" strokeWidth="1">
        <g transform="translate(-694 -689)">
          <g transform="translate(684 681)">
            <rect width="54" height="54" x="0" y="0" rx="6"></rect>
            <g transform="translate(2.5 2.5)">
              <path
                fillRule="nonzero"
                d="M16.261 20.33a.817.817 0 000 1.17 4.953 4.953 0 01.462 6.466c-.247.33-.198.775.083 1.072a.834.834 0 001.253-.082 6.63 6.63 0 00-.066-8L30.561 8.39a2.06 2.06 0 012.919 0 2.06 2.06 0 010 2.92l-8.46 8.46a.817.817 0 000 1.171c.329.33.84.33 1.17 0l10.787-10.786a2.06 2.06 0 012.919 0 2.06 2.06 0 010 2.919L29.109 23.859a.817.817 0 000 1.171c.33.33.842.33 1.171 0l9.039-9.038a2.06 2.06 0 012.919 0 2.06 2.06 0 010 2.92L32.028 29.12a.817.817 0 000 1.17c.33.33.842.33 1.172 0l6.712-6.712a2.06 2.06 0 012.92 0 2.06 2.06 0 010 2.92L31.17 38.158c-5.31 5.31-13.937 5.31-19.247 0-5.311-5.31-5.311-13.937 0-19.248l7.586-7.586a2.06 2.06 0 012.92 0 2.06 2.06 0 010 2.919L16.26 20.33zm1.534-13.195c0-.676-.56-1.237-1.237-1.237-.066 0-.115 0-.181.017a9.92 9.92 0 00-8.379 8.378c0 .05-.016.116-.016.182 0 .676.56 1.237 1.237 1.237.626 0 1.138-.462 1.22-1.056a7.417 7.417 0 016.284-6.284 1.258 1.258 0 001.072-1.237zm16.493 33.646c0 .676.561 1.237 1.237 1.237.066 0 .116 0 .182-.016a9.92 9.92 0 008.378-8.379c0-.05.017-.115.017-.181 0-.676-.561-1.237-1.237-1.237-.627 0-1.138.462-1.22 1.055a7.417 7.417 0 01-6.285 6.284c-.61.1-1.072.61-1.072 1.237z"
              ></path>
            </g>
          </g>
        </g>
      </g>
    </SVGIcon>
  );
};
