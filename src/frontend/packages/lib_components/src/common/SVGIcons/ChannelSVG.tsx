import React from 'react';

import SVGIcon, { SvgProps } from '.';

export const ChannelSVG = (svgProps: SvgProps) => {
  return (
    <SVGIcon viewBox={{ x: 0, y: 0, width: 28, height: 28 }} {...svgProps}>
      <g fill="none" fillRule="evenodd" stroke="none" strokeWidth="1">
        <path
          fillRule="nonzero"
          d="M20.182 3c1 0 1.818.818 1.818 1.818v10.91c0 1-.818 1.817-1.818 1.817h-6.364v1.819h.91c.5 0 .908.409.908.909s-.409.909-.909.909H9.273c-.5 0-.91-.41-.91-.91s.41-.908.91-.908h.909v-1.819H3.818c-1 0-1.818-.818-1.818-1.818V4.818C2 3.818 2.818 3 3.818 3zm-.91 1.818H4.728c-.5 0-.909.41-.909.91v9.09c0 .5.41.91.91.91h14.545c.5 0 .909-.41.909-.91v-9.09c0-.5-.41-.91-.91-.91zm-2.908.91c.6 0 1.09.49 1.09 1.09v6.546c0 .6-.49 1.09-1.09 1.09H7.636c-.6 0-1.09-.49-1.09-1.09V6.818c0-.6.49-1.09 1.09-1.09zm-4.888 2.448a.545.545 0 00-.84.459v2.912c0 .431.48.693.84.458l2.264-1.456a.545.545 0 000-.916z"
          transform="translate(2 2)"
        />
      </g>
    </SVGIcon>
  );
};
