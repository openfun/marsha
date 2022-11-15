import {
  Box,
  Text,
  Card as GrommetCard,
  CardHeader,
  CardBody,
  CardFooter,
  BoxExtendedProps,
  BoxTypes,
} from 'grommet';
import React, { PropsWithChildren, useEffect, useState } from 'react';
import styled from 'styled-components';

const CardBox = styled(Box)`
  gap: 1.7rem;
`;
export const ContentCards = ({
  children,
  ...boxProps
}: PropsWithChildren<BoxExtendedProps>) => {
  return (
    <CardBox direction="row" wrap={true} justify="start" {...boxProps}>
      {children}
    </CardBox>
  );
};

interface CardLayoutPropsExtended {
  opacity: number;
}
const CardLayout = styled(GrommetCard)<CardLayoutPropsExtended>`
  opacity: ${(props) => props.opacity};
  transition: opacity 0.6s;
  cursor: pointer;
`;

interface ContentCardProps extends BoxTypes {
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
    <CardLayout
      height="inherit"
      width="xsmedium"
      background="white"
      round="xsmall"
      opacity={opacity}
      elevation="medium"
      {...cardLayoutProps}
    >
      <CardHeader>{header}</CardHeader>
      <CardBody pad={{ horizontal: 'medium', top: 'xsmall', bottom: 'xsmall' }}>
        <Text size="small" weight="bold" color="#093388">
          {title}
        </Text>
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
      <CardFooter
        pad={{ horizontal: 'small', vertical: 'small' }}
        direction="column"
        align="left"
        gap="xsmall"
      >
        {footer}
      </CardFooter>
    </CardLayout>
  );
};
