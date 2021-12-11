import React, { useRef, useState, useLayoutEffect, useContext } from 'react';
import { Box, Text, ResponsiveContext } from 'grommet';
import ResizeObserver from 'resize-observer-polyfill';
import styled from 'styled-components';

import { SvgProps } from 'components/SVGIcons';
import { Nullable } from 'utils/types';

interface ResponsiveProps {
  screenSize: string;
}

const IconBox = styled(Box)`
  display: flex;
  height: ${({ screenSize }: ResponsiveProps) =>
    screenSize === 'small' ? '60%' : '80%'};
  margin: ${({ screenSize }: ResponsiveProps) =>
    screenSize === 'small' ? '0 6px' : '0 8px'};
  margin-bottom: 6px;
  min-height: 0;
  position: relative;
`;

const TextBox = styled(Box)`
  display: flex;
  height: ${({ screenSize }: ResponsiveProps) =>
    screenSize === 'small' ? '40%' : '20%'};
  text-align: center;
  width: 100%;
`;

const StyledText = styled(Text)`
  font-family: Roboto-Regular;
  font-weight: normal;
  font-size: ${({ screenSize }: ResponsiveProps) =>
    screenSize === 'small' ? '0.7rem' : '0.9rem'};
  letter-spacing: ${({ screenSize }: ResponsiveProps) =>
    screenSize === 'small' ? '-0.3px' : '-0.13px'};
  line-height: ${({ screenSize }: ResponsiveProps) =>
    screenSize === 'small' ? '0.8rem' : '0.9rem'};
  margin: auto;
`;

export interface ButtonLayoutSubComponentProps {
  badge?: JSX.Element;
  Icon?: React.FC<SvgProps>;
  label?: string;
}

interface ButtonLayoutProps extends ButtonLayoutSubComponentProps {
  reversed?: boolean;
  reversedColor: string;
  tintColor: string;
  textColor: string;
}

export const ButtonLayout = ({
  badge,
  Icon,
  label,
  reversed,
  reversedColor,
  tintColor,
  textColor,
}: ButtonLayoutProps) => {
  const size = useContext(ResponsiveContext);
  const iconRef = useRef<Nullable<HTMLDivElement>>(null);
  const [iconWidth, setIconWidth] = useState(0);

  useLayoutEffect(() => {
    if (iconRef.current === null) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length !== 1) {
        return;
      }
      setIconWidth(
        Math.min(entries[0].contentRect.height, entries[0].contentRect.width),
      );
    });
    resizeObserver.observe(iconRef.current);
    return () => {
      if (iconRef.current === null) {
        return;
      }

      resizeObserver.unobserve(iconRef.current);
    };
  }, []);

  let iconColor;
  let containerStyle: React.CSSProperties;

  if (!reversed) {
    iconColor = tintColor;
    containerStyle = {
      background: 'none',
      width: `${iconWidth}px`,
    };
  } else {
    iconColor = reversedColor;
    containerStyle = {
      background: tintColor,
      borderRadius: '6px',
      width: `${iconWidth}px`,
    };
  }

  return (
    <Box align="center" fill>
      {Icon && (
        <IconBox ref={iconRef} screenSize={size} width="100%">
          <Box margin="auto">
            <Icon containerStyle={containerStyle} iconColor={iconColor} />
            {badge}
          </Box>
        </IconBox>
      )}

      {label && (
        <TextBox screenSize={size}>
          <StyledText color={textColor} screenSize={size} size=".8rem">
            {label}
          </StyledText>
        </TextBox>
      )}
    </Box>
  );
};
