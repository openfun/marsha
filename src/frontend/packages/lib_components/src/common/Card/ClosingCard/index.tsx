import { Button } from '@openfun/cunningham-react';
import { Box, BoxTypes, CardBody, Card as GrommetCard } from 'grommet';
import { FormClose } from 'grommet-icons';
import { PropsWithChildren, ReactNode, useState } from 'react';
import styled from 'styled-components';

const CardLayout = styled(GrommetCard)`
  transition: all 0.3s;
`;

interface ClosingCardProps extends BoxTypes {
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
    height: 0,
    opacity: 0,
  };

  return (
    <CardLayout
      height="inherit"
      width="xsmedium"
      background="white"
      round="xsmall"
      elevation="small"
      {...cardLayoutProps}
      style={
        display ? cardLayoutProps.style : { ...cardLayoutProps.style, ...hide }
      }
      role="alert"
      aria-hidden={!display}
    >
      <CardBody pad={{ left: 'medium', vertical: 'xsmall', right: 'small' }}>
        <Box direction="row" justify="between" align="center">
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
          <Box
            pad={{ vertical: 'small' }}
            direction="column"
            align="left"
            gap="xsmall"
          >
            {children}
          </Box>
        )}
      </CardBody>
    </CardLayout>
  );
};
