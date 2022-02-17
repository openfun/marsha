import { Box, Text } from 'grommet';
import React, { useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { Meeting } from 'apps/bbb/types/models';

const messages = defineMessages({
  meetingEnded: {
    defaultMessage: 'Meeting ended.',
    description: 'Message when meeting is ended.',
    id: 'component.DashboardMeetingStudent.meetingEnded',
  },
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

  let message;
  if (meeting.started) {
    message = messages.meetingRedirection;
  } else if (meeting.ended) {
    message = messages.meetingEnded;
  } else {
    message = messages.meetingNotStarted;
  }

  return (
    <Box pad="large" align="center">
      <Text>
        <FormattedMessage {...message} />
      </Text>
    </Box>
  );
};

export default DashboardMeetingStudent;
