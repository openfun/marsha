import { Box } from 'grommet';
import React, { PropsWithChildren } from 'react';

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
      background="bg-marsha"
      margin={{ left: isDesktop ? 'auto' : undefined }}
      basis={isDesktop ? '50%' : '100%'}
      justify="center"
      pad="medium"
    >
      <Box
        background="white"
        direction="column"
        pad="medium"
        round="small"
        style={{
          boxShadow: '0px 0px 6px 0px rgba(2, 117, 180, 0.3)',
        }}
        className="clr-primary-500"
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
