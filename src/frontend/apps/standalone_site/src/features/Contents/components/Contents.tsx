import { Box, Text } from 'grommet';
import { StyledLink } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { ClassRooms } from 'features/Contents';
import { routes } from 'routes';

const messages = defineMessages({
  MyClassrooms: {
    defaultMessage: 'My Classrooms',
    description: 'HomePage title',
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

function Contents() {
  const intl = useIntl();

  return (
    <Box margin={{ top: 'medium' }}>
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
        <ClassRooms withPagination={false} limit={5} />
      </Box>
    </Box>
  );
}

export default Contents;
