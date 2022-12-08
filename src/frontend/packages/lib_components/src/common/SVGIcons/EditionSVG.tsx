import React from 'react';

import SVGIcon, { SvgProps } from '.';

export const EditionSVG = (svgProps: SvgProps) => {
  return (
    <SVGIcon viewBox={{ x: 0, y: 0, width: 24, height: 24 }} {...svgProps}>
      <g fill="none" fillRule="evenodd" stroke="none" strokeWidth="1">
        <g fill="#055FD2" transform="translate(-809 -852)">
          <g transform="translate(50 691)">
            <g transform="translate(759 161)">
              <path d="M0 14.463v3.04c0 .28.22.5.5.5h3.04c.13 0 .26-.05.35-.15l10.92-10.91-3.75-3.75L.15 14.102c-.1.1-.15.22-.15.36zm17.71-10.42a.996.996 0 000-1.41L15.37.292a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            </g>
          </g>
        </g>
      </g>
    </SVGIcon>
  );
};
