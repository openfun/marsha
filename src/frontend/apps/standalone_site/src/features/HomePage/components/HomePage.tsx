import { Image, Box, Text } from 'grommet';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import card1 from 'assets/img/card-1.png';
import card2 from 'assets/img/card-2.png';
import card3 from 'assets/img/card-3.png';
import banner from 'assets/img/homepage-banner.png';

import Card from './Card';

const messages = defineMessages({
  HomePage: {
    defaultMessage: 'Homepage',
    description: 'HomePage title',
    id: 'HomePage.HomePage.HomePage',
  },
  SeeEverything: {
    defaultMessage: 'See Everything',
    description: 'Label to see all the cards',
    id: 'HomePage.HomePage.SeeEverything',
  },
});

const HomePageBox = styled(Box)`
  color: #002c84;
`;

const BlockBox = styled(Box)`
  display: block;
`;

const CardBox = styled(Box)`
  gap: 1.7rem;
`;

const cards = [
  {
    image: card1,
    title: 'Smart Building',
  },
  {
    image: card2,
    title: 'Défi énergétiques et risques sanitaires dans les transports',
  },
  {
    image: card3,
    title: 'Eco Concevoir demain',
  },
  {
    image: card1,
    title: 'La politique publique des déchets en 5 questions',
  },
  {
    image: card1,
    title: 'Smart Building',
  },
  {
    image: card2,
    title: 'Défi énergétiques et risques sanitaires dans les transports',
  },
  {
    image: card3,
    title: 'Eco Concevoir demain',
  },
  {
    image: card1,
    title: 'La politique publique des déchets en 5 questions',
  },
  {
    image: card1,
    title: 'Smart Building',
  },
  {
    image: card2,
    title: 'Défi énergétiques et risques sanitaires dans les transports',
  },
  {
    image: card3,
    title: 'Eco Concevoir demain',
  },
  {
    image: card1,
    title: 'La politique publique des déchets en 5 questions',
  },
];

function HomePage() {
  const intl = useIntl();

  return (
    <HomePageBox>
      <BlockBox margin={{ top: 'large', horizontal: 'auto' }}>
        <Image src={banner} alt="Homepage Banner" width="fit-content" />
      </BlockBox>
      <Box margin={{ top: 'medium' }}>
        <Box direction="row" justify="between" margin={{ bottom: 'small' }}>
          <Text weight="bolder">{intl.formatMessage(messages.HomePage)}</Text>
          <Text weight="bolder">
            › {intl.formatMessage(messages.SeeEverything)}
          </Text>
        </Box>
        <CardBox direction="row" wrap={true} justify="evenly">
          {cards.map((card, index) => (
            <Card
              key={`homepage-card-${index}`}
              image={card.image}
              title={card.title}
            />
          ))}
        </CardBox>
      </Box>
    </HomePageBox>
  );
}

export default HomePage;
