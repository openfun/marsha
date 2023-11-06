import { Box, Heading, Text } from 'lib-components';
import { DateTime } from 'luxon';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useCurrentLive } from '@lib-video/hooks/useCurrentVideo';

const messages = defineMessages({
  noTitle: {
    defaultMessage: 'This live has no title yet.',
    description: 'Title to advertise a live which has no title set yet.',
    id: 'component.StudentLiveAdvertising.StudentLiveDescription.noTitle',
  },
});

interface StudentLiveScheduleInfoProps {
  startDate?: DateTime;
}

export const StudentLiveDescription = ({
  startDate,
}: StudentLiveScheduleInfoProps) => {
  const intl = useIntl();
  const live = useCurrentLive();
  const isScheduledPassed = startDate && startDate < DateTime.now();

  return (
    <Box margin={{ top: 'small' }}>
      <Heading
        aria-label={live.title || undefined}
        level={2}
        textAlign="center"
        style={{ fontStyle: live.title ? undefined : 'italic' }}
      >
        {live.title ||
          (!isScheduledPassed && intl.formatMessage(messages.noTitle))}
      </Heading>
      {live.description && (
        <Text type="p" size="large" className="ml-l mr-l" textAlign="center">
          {live.description}
        </Text>
      )}
    </Box>
  );
};
