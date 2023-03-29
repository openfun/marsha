import { Box, Text } from 'grommet';
import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import {
  DashboardClassroomLayout,
  DashboardClassroomMessage,
} from '@lib-classroom/components/DashboardClassroomLayout';

const errorMessages = {
  notFound: defineMessages({
    text: {
      defaultMessage: `This classroom does not exist or has not been published yet.
      If you are an instructor, please make sure you are properly authenticated.`,
      description: 'Helpful text for the 404 Not Found error page',
      id: 'components.DashboardClassroomError.notFound.text',
    },
    title: {
      defaultMessage: 'The classroom you are looking for could not be found',
      description: 'Title for the 404 Not Found error page',
      id: 'components.DashboardClassroomError.notFound.title',
    },
  }),
};

export const DashboardClassroomError = () => {
  const intl = useIntl();
  const left = (
    <Box>
      <DashboardClassroomMessage
        message={intl.formatMessage(errorMessages.notFound.title)}
      />
      <Text
        textAlign="center"
        margin={{ vertical: 'large' }}
        color="blue-active"
      >
        <FormattedMessage {...errorMessages.notFound.text} />
      </Text>
    </Box>
  );
  return <DashboardClassroomLayout left={left} />;
};
