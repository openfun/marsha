import { Image, Box, Text } from 'grommet';
import { useClassrooms } from 'lib-classroom';
import { StyledLink } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import banner from 'assets/img/homepage-banner.png';
import { ContentCards } from 'components/Cards';
import ManageAPIState from 'components/ManageAPIState/';
import { ClassRoomItem } from 'features/ClassRoom';
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

function HomePage() {
  const intl = useIntl();
  const contentPath = routes.CONTENTS.path;

  const {
    isError,
    isLoading,
    data: classRooms,
  } = useClassrooms(
    {
      offset: `0`,
      limit: `5`,
    },
    { keepPreviousData: true, staleTime: 20000 },
  );

  return (
    <Box margin={{ top: 'medium' }}>
      <BlockBox margin={{ horizontal: 'auto' }}>
        <Image src={banner} alt="Homepage Banner" width="100%" />
      </BlockBox>
      <Box margin={{ top: 'medium' }}>
        <BoxText direction="row" justify="between" margin={{ bottom: 'small' }}>
          <Text weight="bolder">{intl.formatMessage(messages.HomePage)}</Text>
          <Text weight="bolder">
            <StyledLink to={`${contentPath}`}>
              › {intl.formatMessage(messages.SeeEverything)}
            </StyledLink>
          </Text>
        </BoxText>
        <ManageAPIState
          isError={isError}
          isLoading={isLoading}
          itemsLength={classRooms?.results.length || 0}
        >
          <ContentCards>
            {classRooms?.results.map((classroom) => (
              <ClassRoomItem
                key={`classroom-${classroom.id}`}
                classroom={classroom}
              />
            ))}
          </ContentCards>
        </ManageAPIState>
      </Box>
    </Box>
  );
}

export default HomePage;
