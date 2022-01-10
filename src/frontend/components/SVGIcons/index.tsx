import React from 'react';
import styled, { CSSProperties } from 'styled-components';
import { normalizeColor } from 'grommet/utils';

import { theme } from 'utils/theme/theme';

const StyledRect = styled.rect<RectInternalProps>`
  fill: ${(props) => normalizeColor(props.focusColor ?? 'none', theme)};
`;

const StyledSVG = styled.svg<SVGInternalProps>`
  path {
    fill: ${(props) => normalizeColor(props.iconColor, theme)};
  }
`;

interface RectInternalProps {
  focusColor?: string;
}

interface SVGInternalProps {
  iconColor: string;
}

export interface SvgProps extends SVGInternalProps, RectInternalProps {
  containerStyle?: CSSProperties;
  height?: string | number;
  width?: string | number;
}

interface SVGIconProps extends SvgProps {
  viewBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Use https://svg2jsx.com/ to convert svg icon from mockup to component :

export const SVGIcon: React.FC<SVGIconProps> = ({
  focusColor,
  children,
  containerStyle,
  height,
  iconColor,
  viewBox,
  width,
}) => (
  <StyledSVG
    height={height}
    width={width}
    iconColor={iconColor}
    style={containerStyle}
    viewBox={
      viewBox
        ? `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
        : undefined
    }
    xmlns="http://www.w3.org/2000/svg"
  >
    {viewBox && (
      <StyledRect
        focusColor={focusColor}
        x={viewBox.x}
        y={viewBox.y}
        width={viewBox.width}
        height={viewBox.height}
        rx="6"
        ry="6"
      />
    )}
    {children}
  </StyledSVG>
);

export default SVGIcon;
