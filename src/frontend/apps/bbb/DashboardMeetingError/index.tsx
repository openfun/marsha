import { Box, Text } from 'grommet';
import React from 'react';

import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import {
  DashboardMeetingLayout,
  DashboardMeetingMessage,
} from 'apps/bbb/DashboardMeetingLayout';

const errorMessages = {
  notFound: defineMessages({
    text: {
      defaultMessage: `This meeting does not exist or has not been published yet.
      If you are an instructor, please make sure you are properly authenticated.`,
      description: 'Helpful text for the 404 Not Found error page',
      id: 'components.DashboardMeetingError.notFound.text',
    },
    title: {
      defaultMessage: 'The meeting you are looking for could not be found',
      description: 'Title for the 404 Not Found error page',
      id: 'components.DashboardMeetingError.notFound.title',
    },
  }),
};

export const DashboardMeetingError = () => {
  const intl = useIntl();
  const left = (
    <Box>
      <DashboardMeetingMessage
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
  return <DashboardMeetingLayout left={left} />;
};
