import { Box, Text } from 'grommet';
import { StyledLink } from 'lib-components';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { routes } from 'routes';

import ClassRooms from './ClassRooms';

const messages = defineMessages({
  MyClassrooms: {
    defaultMessage: 'My Classrooms',
    description: 'My contents page, my classrooms title',
    id: 'features.Contents.features.ClassRoomContents.MyClassrooms',
  },
  SeeEverything: {
    defaultMessage: 'See Everything',
    description: 'Label to see all the cards',
    id: 'features.Contents.features.ClassRoomContents.SeeEverything',
  },
});

const BoxText = styled(Box)`
  color: #002c84;
`;

interface ClassRoomContentsProps {
  playlistId?: string;
}

const ClassRoomContents = ({ playlistId }: ClassRoomContentsProps) => {
  const intl = useIntl();
  const amountContents = 4;
  const queryParam = playlistId ? `?playlist=${playlistId}` : '';

  return (
    <Box margin={{ top: 'medium' }}>
      <BoxText direction="row" justify="between" margin={{ bottom: 'small' }}>
        <Text weight="bolder">{intl.formatMessage(messages.MyClassrooms)}</Text>
        <Text weight="bolder">
          <StyledLink
            to={{
              pathname: `${routes.CONTENTS.subRoutes.CLASSROOM.path}`,
              search: queryParam,
            }}
          >
            › {intl.formatMessage(messages.SeeEverything)}
          </StyledLink>
        </Text>
      </BoxText>
      <ClassRooms
        withPagination={false}
        limit={amountContents}
        playlistId={playlistId}
        withFilter={false}
      />
    </Box>
  );
};

export default ClassRoomContents;
