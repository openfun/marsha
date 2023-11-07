import { ThemeContext } from 'grommet';
import React, { PropsWithChildren, SVGProps, useContext } from 'react';
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
  fill: ${({ focusColor }) => focusColor || 'none'};
`;

const StyledSVG = styled.svg<StyledSVGProps>`
  path {
    fill: ${({ iconColor }) => iconColor};
  }
`;

export interface SvgProps
  extends SVGInternalProps,
    RectInternalProps,
    Omit<SVGProps<SVGSVGElement>, 'viewBox' | 'ref'> {
  containerStyle?: CSSProperties;
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
  viewBox,
  onClick,
  style,
  ...props
}: PropsWithChildren<SvgProps>) => {
  const theme = useContext(ThemeContext);

  return (
    <StyledSVG
      grommetTheme={theme}
      role={onClick ? 'button' : 'img'}
      style={{
        ...containerStyle,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      onClick={onClick}
      viewBox={
        viewBox
          ? `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
          : undefined
      }
      xmlns="http://www.w3.org/2000/svg"
      {...props}
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
