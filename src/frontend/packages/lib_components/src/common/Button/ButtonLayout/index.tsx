import { Box } from 'grommet';
import React from 'react';
import styled from 'styled-components';

import { Text } from '@lib-components/common/Text';
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
          <Text color={textColor} size={isMobile ? 'small' : 'medium'}>
            {label}
          </Text>
        </TextBox>
      )}
    </Box>
  );
};
