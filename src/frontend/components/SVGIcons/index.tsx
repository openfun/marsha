import React from 'react';
import styled from 'styled-components';
import { normalizeColor } from 'grommet/utils';

import { theme } from 'utils/theme/theme';

const StyledSVG = styled.svg<SvgProps>`
  path {
    fill: ${(props) => normalizeColor(props.baseColor, theme)};
  }

  :hover {
    path {
      fill: ${(props) => normalizeColor(props.hoverColor, theme)};
    }
  }
`;

export interface SvgProps {
  baseColor: string;
  height: string;
  hoverColor: string;
  width: string;
}

interface SVGIconProps extends SvgProps {
  title: string;
  viewBox: string;
}

// Use https://svg2jsx.com/ to convert svg icon from mockup to component :

const SVGIcon: React.FC<SVGIconProps> = ({
  baseColor,
  children,
  height,
  hoverColor,
  title,
  viewBox,
  width,
}) => {
  return (
    <StyledSVG
      baseColor={baseColor}
      height={height}
      hoverColor={hoverColor}
      viewBox={viewBox}
      width={width}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      {children}
    </StyledSVG>
  );
};

export default SVGIcon;
