import { Box, Text } from 'grommet';
import React, { useEffect } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { DashboardButton } from 'components/DashboardPaneButtons/DashboardButtons';

import { Meeting } from 'apps/bbb/types/models';

const messages = defineMessages({
  joinedAs: {
    defaultMessage: 'You have joined the meeting as {joinedAs}.',
    description: 'Message when user has joined the meeting.',
    id: 'component.DashboardMeetingStudent.joinedAs',
  },
  joinMeetingLabel: {
    defaultMessage: 'Join meeting',
    description: 'Label for joining meeting in instructor dashboard.',
    id: 'component.DashboardMeetingStudent.joinMeetingLabel',
  },
  meetingEnded: {
    defaultMessage: 'Meeting ended.',
    description: 'Message when meeting has ended.',
    id: 'component.DashboardMeetingStudent.meetingEnded',
  },
  meetingNotStarted: {
    defaultMessage: 'Meeting not started yet.',
    description: 'Message when meeting is not started.',
    id: 'component.DashboardMeetingStudent.meetingNotStarted',
  },
  meetingStarted: {
    defaultMessage: 'Meeting is started.',
    description: 'Message when meeting is started.',
    id: 'component.DashboardMeetingStudent.meetingStarted',
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
  const intl = useIntl();

  useEffect(() => {
    if (!meeting.started) {
      meetingEnded();
    }
  }, [meeting]);

  let content: JSX.Element;
  if (joinedAs) {
    content = (
      <Text textAlign="center">
        <FormattedMessage {...messages.joinedAs} values={{ joinedAs }} />
      </Text>
    );
  } else if (meeting.started) {
    content = (
      <React.Fragment>
        <Text textAlign="center">
          <FormattedMessage {...messages.meetingStarted} />
        </Text>
        <Box direction="row" justify="center" margin={{ top: 'medium' }}>
          <DashboardButton
            primary={true}
            label={intl.formatMessage(messages.joinMeetingLabel)}
            onClick={joinMeetingAction}
          />
        </Box>
      </React.Fragment>
    );
  } else if (meeting.ended) {
    content = (
      <Text textAlign="center">
        <FormattedMessage {...messages.meetingEnded} />
      </Text>
    );
  } else {
    content = (
      <Text textAlign="center">
        <FormattedMessage {...messages.meetingNotStarted} />
      </Text>
    );
  }

  return (
    <Box pad="large" fill>
      {content}
    </Box>
  );
};

export default DashboardMeetingStudent;
