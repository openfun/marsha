import React from 'react';

import SVGIcon, { SvgProps } from '.';

export const JoinDiscussionSVG = (svgProps: SvgProps) => {
  return (
    <SVGIcon viewBox={{ x: 0, y: 0, width: 54, height: 54 }} {...svgProps}>
      <g fillRule="evenodd" stroke="none" strokeWidth="1">
        <g transform="translate(0.5 2.5)">
          <path
            fillRule="nonzero"
            d="M41.492 31.944c0 7.674-6.215 13.89-13.889 13.89a13.84 13.84 0 01-12.847-8.716l-5.26-13.212c-.538-1.371.746-2.743 2.153-2.291l1.371.451a3.484 3.484 0 012.153 2.014l2.222 5.573a.856.856 0 00.799.555h.729V9.81a2.17 2.17 0 014.34 0v14.323a.86.86 0 00.868.868.86.86 0 00.868-.868V6.337a2.17 2.17 0 014.34 0v17.795a.86.86 0 00.869.868.86.86 0 00.868-.868V8.94a2.17 2.17 0 014.34 0v15.19a.86.86 0 00.868.869.86.86 0 00.868-.868v-9.983a2.17 2.17 0 014.34 0v17.795z"
          ></path>
        </g>
      </g>
    </SVGIcon>
  );
};
