import React, { useContext } from 'react';
import { Box, Text, ResponsiveContext } from 'grommet';
import styled from 'styled-components';

import { SvgProps } from 'components/SVGIcons';

interface ResponsiveProps {
  screenSize: string;
}

const IconBox = styled(Box)`
  align-items: center;
  display: block;
  height: 100%;
  justify-content: center;
  margin: ${({ screenSize }: ResponsiveProps) =>
    screenSize === 'small' ? '0 6px' : '0 8px'};
  min-height: 0;
  position: relative;
  text-align: center;
`;

const TextBox = styled(Box)`
  display: flex;
  margin-top: 6px;
  text-align: center;
`;

const StyledText = styled(Text)`
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

  let iconColor;
  let rectColor;

  if (!reversed) {
    iconColor = tintColor;
    rectColor = 'none';
  } else {
    iconColor = reversedColor;
    rectColor = tintColor;
  }

  return (
    <Box align="center" fill>
      {Icon && (
        <IconBox screenSize={size}>
          <Icon iconColor={iconColor} focusColor={rectColor} height="100%" />
          {badge}
        </IconBox>
      )}

      {label && (
        <TextBox>
          <StyledText color={textColor} screenSize={size} size=".8rem">
            {label}
          </StyledText>
        </TextBox>
      )}
    </Box>
  );
};
