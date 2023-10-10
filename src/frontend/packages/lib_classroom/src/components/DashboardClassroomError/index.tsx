import { Box } from 'grommet';
import { Text } from 'lib-components';
import React from 'react';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';

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

interface DashboardClassroomErrorProps {
  message?: string;
}

export const DashboardClassroomError = ({
  message,
}: DashboardClassroomErrorProps) => {
  const intl = useIntl();
  const left = message ? (
    <Box>
      <DashboardClassroomMessage message={message} />
    </Box>
  ) : (
    <Box>
      <DashboardClassroomMessage
        message={intl.formatMessage(errorMessages.notFound.title)}
      />
      <Text textAlign="center" className="mt-b mb-b">
        <FormattedMessage {...errorMessages.notFound.text} />
      </Text>
    </Box>
  );
  return <DashboardClassroomLayout left={left} />;
};
