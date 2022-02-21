import { Box, Text } from 'grommet';
import React, { useEffect } from 'react';
import {
  defineMessages,
  FormattedMessage,
  MessageDescriptor,
} from 'react-intl';

import { Meeting } from 'apps/bbb/types/models';

const messages = defineMessages({
  joinedAs: {
    defaultMessage: 'You have joined the meeting as {joinedAs}.',
    description: 'Message when user has joined the meeting.',
    id: 'component.DashboardMeetingStudent.joinedAs',
  },
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
    defaultMessage: 'Meeting is started.',
    description: 'Message when meeting is started.',
    id: 'component.DashboardMeetingStudent.meetingRedirection',
  },
});

interface DashboardMeetingStudentProps {
  meeting: Meeting;
  joinedAs: string | false;
  joinMeetingAction: () => void;
  meetingEnded: () => void;
}

const DashboardMeetingStudent = ({
  meeting,
  joinedAs,
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

  let message: MessageDescriptor;
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
        {joinedAs ? (
          <FormattedMessage {...messages.joinedAs} values={{ joinedAs }} />
        ) : (
          <FormattedMessage {...message} />
        )}
      </Text>
    </Box>
  );
};

export default DashboardMeetingStudent;
