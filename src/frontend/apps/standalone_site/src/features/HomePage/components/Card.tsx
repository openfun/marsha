import { ReactComponent as BarreCodeIcon } from 'assets/svg/iko_boot_code_barresvg.svg';
import { ReactComponent as UniversityIcon } from 'assets/svg/iko_boot_universitesvg.svg';
import {
  Image,
  Box,
  Text,
  Card as GrommetCard,
  CardHeader,
  CardBody,
  CardFooter,
} from 'grommet';
import React from 'react';
import styled from 'styled-components';

const CardLayout = styled(GrommetCard)`
  box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.2);
`;

interface CardProps {
  image: string;
  title: string;
}

function Card({ image, title }: CardProps) {
  return (
    <CardLayout
      height="inherit"
      width="234px"
      background="white"
      round="xsmall"
    >
      <CardHeader role="img">
        <Image src={image} alt={`Image about ${title}`} fit="contain" />
      </CardHeader>
      <CardBody pad={{ horizontal: 'medium', top: 'xsmall', bottom: 'xsmall' }}>
        <Text size="small" weight="bold" color="#093388">
          {title}
        </Text>
      </CardBody>
      <CardFooter
        pad={{ horizontal: 'small', vertical: 'small' }}
        direction="column"
        align="left"
        gap="xsmall"
      >
        <Box gap="small" align="center" direction="row">
          <Box>
            <UniversityIcon width={20} height={20} />
          </Box>
          <Text size="0.688rem" weight="bold">
            Conservatoire nationale des Arts et Métiers (Cnam)
          </Text>
        </Box>
        <Box gap="small" align="center" direction="row">
          <Box>
            <BarreCodeIcon width={20} height={20} color="#093388" />
          </Box>
          <Text size="0.688rem" weight="bold" color="#093388">
            011042
          </Text>
        </Box>
      </CardFooter>
    </CardLayout>
  );
}

export default Card;
