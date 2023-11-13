import { colorsTokens } from '@lib-common/cunningham';
import React, { PropsWithChildren, useEffect, useState } from 'react';

import { Box, BoxProps, Text } from '@lib-components/common';
import { useResponsive } from '@lib-components/hooks';

export const ContentCards = ({
  children,
  ...boxProps
}: PropsWithChildren<BoxProps<'div'>>) => {
  const { isSmallerBreakpoint, breakpoint } = useResponsive();
  const isSmallerXsmedium = isSmallerBreakpoint(breakpoint, 'smedium');

  return (
    <Box
      direction="row"
      justify={isSmallerXsmedium ? 'center' : 'start'}
      gap="medium"
      {...boxProps}
      style={{
        flexWrap: 'wrap',
        transition: 'all 0.3s',
        ...boxProps.style,
      }}
    >
      {children}
    </Box>
  );
};

interface ContentCardProps extends BoxProps<'div'> {
  header: React.ReactNode;
  footer?: React.ReactNode;
  title: string;
}

export const ContentCard = ({
  header,
  footer,
  title,
  children,
  ...cardLayoutProps
}: PropsWithChildren<ContentCardProps>) => {
  const [opacity, setOpacity] = useState(0);

  /**
   * This is the trick to make the card fade in when it is loaded.
   * There is a latence between when opacity is set and when useEffect is called.
   * The css transition property will give the fade in effect.
   */
  useEffect(() => {
    setOpacity(1);
  }, []);

  return (
    <Box
      width="xsmedium"
      background="white"
      round="xsmall"
      elevation
      justify="space-between"
      pad={{ bottom: 'xsmall' }}
      overflow="auto"
      {...cardLayoutProps}
      style={{
        opacity,
        transition: 'all 0.3s ease-in-out',
        cursor: 'pointer',
        ...cardLayoutProps.style,
      }}
    >
      <Box type="header">{header}</Box>
      <Box justify="space-between" flex="grow">
        <Box pad={{ horizontal: 'medium', top: 'xsmall', bottom: 'xxsmall' }}>
          <Text weight="bold" color={colorsTokens['primary-800']}>
            {title}
          </Text>
          {children && (
            <Box pad={{ vertical: 'xsmall' }} align="left" gap="xsmall">
              {children}
            </Box>
          )}
        </Box>
        <Box
          type="footer"
          pad={{ horizontal: 'small', vertical: 'xsmall' }}
          align="left"
          gap="xxsmall"
        >
          {footer}
        </Box>
      </Box>
    </Box>
  );
};
