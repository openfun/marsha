import { Box, Text } from 'grommet';
import { StyledLink } from 'lib-components';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { ClassRooms, Videos, Lives } from 'features/Contents';
import { routes } from 'routes';

const messages = defineMessages({
  MyLives: {
    defaultMessage: 'My Lives',
    description: 'My contents page, my lives title',
    id: 'features.Contents.Contents.MyLives',
  },
  MyVideos: {
    defaultMessage: 'My Videos',
    description: 'My contents page, my videos title',
    id: 'features.Contents.Contents.MyVideos',
  },
  MyClassrooms: {
    defaultMessage: 'My Classrooms',
    description: 'My contents page, my classrooms title',
    id: 'features.Contents.Contents.MyClassrooms',
  },
  SeeEverything: {
    defaultMessage: 'See Everything',
    description: 'Label to see all the cards',
    id: 'features.Contents.Contents.SeeEverything',
  },
});

const BoxText = styled(Box)`
  color: #002c84;
`;

const Contents = () => {
  const intl = useIntl();

  return (
    <Box margin={{ top: 'medium' }}>
      <Box margin={{ top: 'medium' }}>
        <BoxText direction="row" justify="between" margin={{ bottom: 'small' }}>
          <Text weight="bolder">{intl.formatMessage(messages.MyLives)}</Text>
          <Text weight="bolder">
            <StyledLink to={`${routes.CONTENTS.subRoutes.LIVE.path}`}>
              › {intl.formatMessage(messages.SeeEverything)}
            </StyledLink>
          </Text>
        </BoxText>
        <Lives withPagination={false} limit={4} />
      </Box>
      <Box margin={{ top: 'medium' }}>
        <BoxText direction="row" justify="between" margin={{ bottom: 'small' }}>
          <Text weight="bolder">{intl.formatMessage(messages.MyVideos)}</Text>
          <Text weight="bolder">
            <StyledLink to={`${routes.CONTENTS.subRoutes.VIDEO.path}`}>
              › {intl.formatMessage(messages.SeeEverything)}
            </StyledLink>
          </Text>
        </BoxText>
        <Videos withPagination={false} limit={4} />
      </Box>
      <Box margin={{ top: 'medium' }}>
        <BoxText direction="row" justify="between" margin={{ bottom: 'small' }}>
          <Text weight="bolder">
            {intl.formatMessage(messages.MyClassrooms)}
          </Text>
          <Text weight="bolder">
            <StyledLink to={`${routes.CONTENTS.subRoutes.CLASSROOM.path}`}>
              › {intl.formatMessage(messages.SeeEverything)}
            </StyledLink>
          </Text>
        </BoxText>
        <ClassRooms withPagination={false} limit={4} />
      </Box>
    </Box>
  );
};

export default Contents;
