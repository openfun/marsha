import { Image, Box, Text } from 'grommet';
import React, { Fragment } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import card1 from 'assets/img/card-1.png';
import card2 from 'assets/img/card-2.png';
import card3 from 'assets/img/card-3.png';
import banner from 'assets/img/homepage-banner.png';
import { ReactComponent as BarreCodeIcon } from 'assets/svg/iko_boot_code_barresvg.svg';
import { ReactComponent as UniversityIcon } from 'assets/svg/iko_boot_universitesvg.svg';
import { ContentCards, ContentCard } from 'components/Cards';

const messages = defineMessages({
  HomePage: {
    defaultMessage: 'Homepage',
    description: 'HomePage title',
    id: 'features.HomePage.HomePage',
  },
  SeeEverything: {
    defaultMessage: 'See Everything',
    description: 'Label to see all the cards',
    id: 'features.HomePage.SeeEverything',
  },
});

const HomePageBox = styled(Box)`
  color: #002c84;
`;

const BlockBox = styled(Box)`
  display: block;
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
      <BlockBox margin={{ horizontal: 'auto' }}>
        <Image src={banner} alt="Homepage Banner" width="fit-content" />
      </BlockBox>
      <Box margin={{ top: 'medium' }}>
        <Box direction="row" justify="between" margin={{ bottom: 'small' }}>
          <Text weight="bolder">{intl.formatMessage(messages.HomePage)}</Text>
          <Text weight="bolder">
            › {intl.formatMessage(messages.SeeEverything)}
          </Text>
        </Box>
        <ContentCards>
          {cards.map(({ title, image }, index) => (
            <ContentCard
              key={`homepage-card-${index}`}
              title={title}
              header={
                <Image src={image} alt={`Image about ${title}`} fit="contain" />
              }
              footer={
                <Fragment>
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
                </Fragment>
              }
            ></ContentCard>
          ))}
        </ContentCards>
      </Box>
    </HomePageBox>
  );
}

export default HomePage;
