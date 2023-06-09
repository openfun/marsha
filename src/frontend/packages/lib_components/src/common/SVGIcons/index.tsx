import { ThemeContext } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React, { PropsWithChildren, useContext } from 'react';
import styled, { CSSProperties } from 'styled-components';

interface ComponentWithTheme {
  grommetTheme: object;
}

interface RectInternalProps {
  focusColor?: string;
}
interface SVGInternalProps {
  iconColor: string;
}

type StyledRectProps = RectInternalProps & ComponentWithTheme;
type StyledSVGProps = SVGInternalProps & ComponentWithTheme;

const StyledRect = styled.rect<StyledRectProps>`
  fill: ${(props) =>
    normalizeColor(props.focusColor ?? 'none', props.grommetTheme)};
`;

const StyledSVG = styled.svg<StyledSVGProps>`
  path {
    fill: ${(props) => normalizeColor(props.iconColor, props.grommetTheme)};
  }
`;

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

export const SVGIcon = ({
  focusColor,
  children,
  containerStyle,
  height,
  iconColor,
  viewBox,
  width,
}: PropsWithChildren<SVGIconProps>) => {
  const theme = useContext(ThemeContext);

  return (
    <StyledSVG
      height={height}
      width={width}
      iconColor={iconColor}
      grommetTheme={theme}
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
          grommetTheme={theme}
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
};

export default SVGIcon;
