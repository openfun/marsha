import React from 'react';

import SVGIcon, { SvgProps } from '.';

export const SpeakerSVG = (svgProps: SvgProps) => {
  return (
    <SVGIcon viewBox={{ x: 0, y: 0, width: 54, height: 54 }} {...svgProps}>
      <g fillRule="evenodd" stroke="none" strokeWidth="1">
        <g transform="translate(2 2.5)">
          <path
            fillRule="nonzero"
            d="M31.25 8.333a2.09 2.09 0 012.083 2.084v29.166a2.09 2.09 0 01-2.083 2.084h-25a2.09 2.09 0 01-2.083-2.084V10.417A2.09 2.09 0 016.25 8.333h25zm12.5 0a2.09 2.09 0 012.078 1.935l.005.149v29.166a2.09 2.09 0 01-1.935 2.078l-.148.006h-4.167a2.09 2.09 0 01-2.078-1.935l-.005-.149V10.417a2.09 2.09 0 011.935-2.078l.148-.006h4.167zm-25 19.271c-3.472 0-10.417 2.096-10.417 5.907v1.906h20.834V33.51c0-3.81-6.945-5.907-10.417-5.907zm0-13.02a5.201 5.201 0 00-5.208 5.208A5.201 5.201 0 0018.75 25a5.201 5.201 0 005.208-5.208 5.201 5.201 0 00-5.208-5.209z"
          ></path>
        </g>
      </g>
    </SVGIcon>
  );
};
