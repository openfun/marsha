import React from 'react';

import SVGIcon, { SvgProps } from '.';

export interface UploadDocSVGProps extends SvgProps {
  title: string;
}

export const UploadDocSVG = ({
  baseColor,
  height,
  hoverColor,
  title,
  width,
}: UploadDocSVGProps) => {
  return (
    <SVGIcon
      baseColor={baseColor}
      height={height}
      hoverColor={hoverColor}
      title={title}
      viewBox={'0 0 22 20'}
      width={width}
    >
      <g fill="none" stroke="none">
        <g transform="translate(-645 -1049)">
          <g transform="translate(50 691)">
            <path
              d="M12.36 16.15L16 19.8h-2V23h-4v-3.2H8l3.65-3.65c.2-.2.51-.2.71 0zM21 3c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2h-3c-.55 0-1-.45-1-1s.45-1 1-1h2c.55 0 1-.45 1-1V6c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h2c.55 0 1 .45 1 1s-.45 1-1 1H3c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2zm-5.889 4c.489 0 .889.4.889.889v6.222c0 .489-.4.889-.889.889H8.89A.892.892 0 018 14.111V7.89C8 7.4 8.4 7 8.889 7zm-2.667 5.333h-2.222a.446.446 0 000 .889h2.222c.245 0 .445-.2.445-.444 0-.245-.2-.445-.445-.445zm1.334-1.777h-3.556c-.244 0-.444.2-.444.444s.2.444.444.444h3.556c.244 0 .444-.2.444-.444s-.2-.444-.444-.444zm0-1.778h-3.556c-.244 0-.444.2-.444.444 0 .245.2.445.444.445h3.556a.446.446 0 000-.889z"
              transform="translate(594 355)"
            />
          </g>
        </g>
      </g>
    </SVGIcon>
  );
};
