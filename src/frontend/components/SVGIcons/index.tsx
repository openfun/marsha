import React from 'react';
import styled, { CSSProperties } from 'styled-components';
import { normalizeColor } from 'grommet/utils';

import { theme } from 'utils/theme/theme';

const StyledSVG = styled.svg<SVGInternalProps>`
  path {
    fill: ${(props) => normalizeColor(props.iconColor, theme)};
  }
`;

interface SVGInternalProps {
  iconColor: string;
}

export interface SvgProps extends SVGInternalProps {
  containerStyle?: CSSProperties;
}

interface SVGIconProps extends SvgProps {
  viewBox?: string;
}

// Use https://svg2jsx.com/ to convert svg icon from mockup to component :

export const SVGIcon: React.FC<SVGIconProps> = ({
  children,
  containerStyle,
  iconColor,
  viewBox,
}) => {
  return (
    <StyledSVG
      iconColor={iconColor}
      style={containerStyle}
      viewBox={viewBox}
      xmlns={'http://www.w3.org/2000/svg'}
    >
      {children}
    </StyledSVG>
  );
};

export default SVGIcon;
