import { Box, Text } from 'grommet';
import React from 'react';
import styled from 'styled-components';

import { useResponsive } from '@lib-components/hooks/useResponsive';

import type { SvgProps } from '../../../common/SVGIcons';

import { Badge } from './Badge';

interface ResponsiveProps {
  isMobile: boolean;
}

const IconBox = styled(Box)`
  align-items: center;
  display: block;
  height: 100%;
  justify-content: center;
  margin: ${({ isMobile }: ResponsiveProps) => (isMobile ? '0 6px' : '0 8px')};
  min-height: 0;
  position: relative;
  text-align: center;
`;

const TextBox = styled(Box)`
  display: flex;
  text-align: center;
`;

const StyledText = styled(Text)`
  font-weight: normal;
  font-size: ${({ isMobile }: ResponsiveProps) =>
    isMobile ? '0.7rem' : '0.9rem'};
  letter-spacing: ${({ isMobile }: ResponsiveProps) =>
    isMobile ? '-0.3px' : '-0.13px'};
  line-height: ${({ isMobile }: ResponsiveProps) =>
    isMobile ? '0.8rem' : '0.9rem'};
`;

export interface ButtonLayoutSubComponentProps {
  badge?: string;
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
  const { isMobile } = useResponsive();
  const iconColor = reversed ? reversedColor : tintColor;
  const rectColor = reversed ? tintColor : undefined;

  return (
    <Box align="center" flex height="100%">
      {Icon && (
        <IconBox isMobile={isMobile}>
          <Icon iconColor={iconColor} focusColor={rectColor} height="100%" />
          {badge && <Badge value={badge} />}
        </IconBox>
      )}

      {label && (
        <TextBox align="center" margin={{ top: '6px' }}>
          <StyledText color={textColor} isMobile={isMobile}>
            {label}
          </StyledText>
        </TextBox>
      )}
    </Box>
  );
};
