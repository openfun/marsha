import { Box, Text } from 'grommet';
import React, { useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { Meeting } from 'apps/bbb/types/models';

const messages = defineMessages({
  meetingNotStarted: {
    defaultMessage: 'Meeting not started yet.',
    description: 'Message when meeting is not started.',
    id: 'component.DashboardMeetingStudent.meetingNotStarted',
  },
  meetingRedirection: {
    defaultMessage: 'You should be redirected to the meeting.',
    description:
      'Message when meeting is started and redirection should be triggered.',
    id: 'component.DashboardMeetingStudent.meetingRedirection',
  },
});

interface DashboardMeetingStudentProps {
  meeting: Meeting;
  joinMeetingAction: () => void;
  meetingEnded: () => void;
}

const DashboardMeetingStudent = ({
  meeting,
  joinMeetingAction,
  meetingEnded,
}: DashboardMeetingStudentProps) => {
  useEffect(() => {
    if (meeting.started) {
      joinMeetingAction();
    } else {
      meetingEnded();
    }
  }, [meeting]);

  return (
    <Box pad="large" align="center">
      {meeting.started ? (
        <Text>
          <FormattedMessage {...messages.meetingRedirection} />
        </Text>
      ) : (
        <Text>
          <FormattedMessage {...messages.meetingNotStarted} />
        </Text>
      )}
    </Box>
  );
};

export default DashboardMeetingStudent;
