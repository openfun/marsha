import { Box, Heading, ResponsiveContext } from 'grommet';
import React, { PropsWithChildren, useContext } from 'react';

interface WhiteCardProps {
  title: string;
}

export const WhiteCard = ({
  title,
  children,
}: PropsWithChildren<WhiteCardProps>) => {
  const isSmall = useContext(ResponsiveContext) === 'small';

  return (
    <Box
      background="bg-marsha"
      margin={{ left: !isSmall ? 'auto' : undefined }}
      basis={!isSmall ? '50%' : '100%'}
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
        height="initial"
      >
        <Heading color="blue-active" fill level={3} textAlign="center">
          {title}
        </Heading>
        {children}
      </Box>
    </Box>
  );
};
