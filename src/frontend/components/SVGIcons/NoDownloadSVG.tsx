import React from 'react';

import SVGIcon, { SvgProps } from '.';

export const NoDownloadSVG = (svgProps: SvgProps) => {
  return (
    <SVGIcon viewBox={{ x: 0, y: 0, width: 24, height: 24 }} {...svgProps}>
      <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <path d="M18,19 C18.55,19 19,19.45 19,20 C19,20.55 18.55,21 18,21 L18,21 L6,21 C5.45,21 5,20.55 5,20 C5,19.45 5.45,19 6,19 L6,19 Z M8.999,8.412 L14.793,14.206 L12.7,16.3 C12.34,16.66 11.775503,16.6876923 11.3840419,16.3830769 L11.29,16.3 L6.7,11.71 C6.07,11.08 6.52,10 7.41,10 L7.41,10 L9,10 L8.999,8.412 Z M14,4 C14.55,4 15,4.45 15,5 L15,5 L15,10 L16.59,10 C17.48,10 17.92,11.08 17.29,11.71 L17.29,11.71 L16.206,12.793 L8.999,5.586 L9,5 C9,4.48928571 9.3880102,4.06479592 9.88380102,4.0067602 L10,4 Z" />
        <rect
          transform="rotate(-315) translate(-12.121320, -12.121320)"
          x="1.12132034"
          y="11.1213203"
          width="22"
          height="2"
          rx="1"
        />
      </g>
    </SVGIcon>
  );
};
