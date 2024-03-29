import { colorsTokens } from '@lib-common/cunningham';
import React, { PropsWithChildren } from 'react';

import { Box } from '@lib-components/common/Box';
import { Heading } from '@lib-components/common/Headings';
import { useResponsive } from '@lib-components/hooks/useResponsive';

interface WhiteCardProps {
  title: string;
}

export const WhiteCard = ({
  title,
  children,
}: PropsWithChildren<WhiteCardProps>) => {
  const { isDesktop } = useResponsive();

  return (
    <Box
      background={colorsTokens['primary-100']}
      margin={{ left: isDesktop ? 'auto' : undefined }}
      basis={isDesktop ? '50%' : '100%'}
      justify="center"
      pad="medium"
    >
      <Box
        background="white"
        pad="medium"
        round="small"
        style={{
          boxShadow: '0px 0px 6px 0px rgba(2, 117, 180, 0.3)',
        }}
        className={colorsTokens['primary-500']}
        height="initial"
      >
        <Heading level={2} textAlign="center">
          {title}
        </Heading>
        {children}
      </Box>
    </Box>
  );
};
