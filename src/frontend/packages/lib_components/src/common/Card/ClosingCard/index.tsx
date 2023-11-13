import { Button } from '@openfun/cunningham-react';
import { FormClose } from 'grommet-icons';
import { PropsWithChildren, ReactNode, useState } from 'react';

import { Box, BoxProps } from '@lib-components/common';

interface ClosingCardProps extends BoxProps<'div'> {
  message: ReactNode;
}

export const ClosingCard = ({
  message,
  children,
  ...cardLayoutProps
}: PropsWithChildren<ClosingCardProps>) => {
  const [display, setDisplay] = useState(true);

  const hide = {
    padding: 0,
    margin: 0,
    maxHeight: 0,
  };

  return (
    <Box
      height={{
        max: 'medium',
      }}
      width="xsmedium"
      background="white"
      round="xsmall"
      elevation
      {...cardLayoutProps}
      style={{
        ...cardLayoutProps.style,
        transition: 'all 0.5s ease-in-out',
        ...(display ? {} : hide),
      }}
      role="alert"
      aria-hidden={!display}
    >
      <Box pad={{ left: 'medium', vertical: 'xsmall', right: 'small' }}>
        <Box direction="row" justify="space-between" align="center">
          <Box>{message}</Box>
          <Button
            className="c__button-no-bg"
            color="tertiary"
            icon={<FormClose color="white" />}
            onClick={() => setDisplay(false)}
            aria-label="close"
          />
        </Box>
        {children && (
          <Box pad={{ vertical: 'small' }} align="left" gap="xsmall">
            {children}
          </Box>
        )}
      </Box>
    </Box>
  );
};
