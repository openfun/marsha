import { Box, Button, Text } from 'grommet';
import { DateTime, Duration, Settings } from 'luxon';
import React, { useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { Nullable } from 'utils/types';

import {
  DashboardMeetingLayout,
  DashboardMeetingMessage,
} from 'apps/bbb/DashboardMeetingLayout';
import { DashboardMeetingStudentCounter } from 'apps/bbb/DashboardMeetingStudentCounter';
import { Meeting } from 'apps/bbb/types/models';

const messages = defineMessages({
  joinedAs: {
    defaultMessage: 'You have joined the meeting as {joinedAs}.',
    description: 'Message when user has joined the meeting.',
    id: 'component.DashboardMeetingStudent.joinedAs',
  },
  joinMeetingLabel: {
    defaultMessage: 'Click here to access meeting',
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

  Settings.defaultLocale = intl.locale;

  const startingAt = DateTime.fromISO(meeting.starting_at || '');
  const displayedStartingAt = startingAt.toLocaleString(DateTime.DATE_HUGE);
  const displayedStartingTime = startingAt.toLocaleString(
    DateTime.TIME_24_SIMPLE,
  );

  let displayedEventTime = `${displayedStartingAt} - ${displayedStartingTime}`;

  if (meeting.estimated_duration) {
    const estimatedDuration = Duration.fromISOTime(meeting.estimated_duration);
    const displayedEndingAt = startingAt
      .plus(estimatedDuration)
      .toLocaleString(DateTime.TIME_24_SIMPLE);
    displayedEventTime += ` > ${displayedEndingAt}`;
  }

  useEffect(() => {
    if (meeting.ended) {
      meetingEnded();
    }
  }, [meeting]);

  let left: JSX.Element;
  let right: Nullable<JSX.Element> = null;
  if (joinedAs) {
    // meeting started and joined
    left = (
      <DashboardMeetingMessage
        message={intl.formatMessage(messages.joinedAs, { joinedAs })}
      />
    );
  } else if (meeting.started) {
    // meeting started
    left = (
      <DashboardMeetingMessage
        message={intl.formatMessage(messages.meetingStarted)}
      />
    );
    right = (
      <Button
        label={intl.formatMessage(messages.joinMeetingLabel)}
        onClick={joinMeetingAction}
        primary
        size="large"
        fill="horizontal"
      />
    );
  } else if (meeting.ended) {
    // meeting ended
    left = (
      <DashboardMeetingMessage
        message={intl.formatMessage(messages.meetingEnded)}
      />
    );
  } else if (meeting.starting_at) {
    // meeting scheduled
    left = (
      <React.Fragment>
        <Text
          size="large"
          weight="bold"
          color="blue-active"
          textAlign="center"
          margin={{ top: 'large' }}
        >
          {meeting.title}
        </Text>
        <Text color="blue-active" textAlign="center">
          {meeting.description}
        </Text>
        <Box
          margin={{ top: 'large', horizontal: 'small' }}
          pad={{ vertical: 'small', horizontal: 'small' }}
          round="xsmall"
          border={{
            color: 'blue-active',
            size: 'small',
            side: 'all',
          }}
        >
          <Text color="blue-active" textAlign="center">
            {displayedEventTime}
          </Text>
        </Box>
        <DashboardMeetingStudentCounter meeting={meeting} />
      </React.Fragment>
    );
  } else {
    // meeting exists but not started
    left = (
      <DashboardMeetingMessage
        message={intl.formatMessage(messages.meetingNotStarted)}
      />
    );
  }

  return <DashboardMeetingLayout left={left} right={right} />;
};

export default DashboardMeetingStudent;
