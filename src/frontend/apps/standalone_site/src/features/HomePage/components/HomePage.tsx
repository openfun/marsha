import { Image, Box, Text } from 'grommet';
import { StyledLink } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import banner from 'assets/img/homepage-banner.png';
import { ContentsShuffle } from 'features/Contents';
import { routes } from 'routes';

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

const BoxText = styled(Box)`
  color: #002c84;
`;

const BlockBox = styled(Box)`
  display: block;
`;

const HomePage = () => {
  const intl = useIntl();

  return (
    <Box margin={{ top: 'medium' }}>
      <BlockBox margin={{ horizontal: 'auto' }}>
        <Image src={banner} alt="Homepage Banner" width="100%" />
      </BlockBox>
      <Box margin={{ top: 'medium' }}>
        <BoxText direction="row" justify="between" margin={{ bottom: 'small' }}>
          <Text weight="bolder">{intl.formatMessage(messages.HomePage)}</Text>
          <Text weight="bolder">
            <StyledLink to={`${routes.CONTENTS.path}`}>
              › {intl.formatMessage(messages.SeeEverything)}
            </StyledLink>
          </Text>
        </BoxText>
        <ContentsShuffle />
      </Box>
    </Box>
  );
};

export default HomePage;
