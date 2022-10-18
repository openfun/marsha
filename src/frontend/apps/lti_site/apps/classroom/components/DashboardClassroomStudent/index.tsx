import { Box, Button, Text } from 'grommet';
import { Nullable } from 'lib-common';
import { DateTime, Duration, Settings } from 'luxon';
import React, { useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import {
  DashboardClassroomLayout,
  DashboardClassroomMessage,
} from 'apps/classroom/components/DashboardClassroomLayout';
import { DashboardClassroomStudentCounter } from 'apps/classroom/components/DashboardClassroomStudentCounter';
import { Classroom } from 'lib-components';

const messages = defineMessages({
  joinedAs: {
    defaultMessage: 'You have joined the classroom as {joinedAs}.',
    description: 'Message when user has joined the classroom.',
    id: 'component.DashboardClassroomStudent.joinedAs',
  },
  joinClassroomLabel: {
    defaultMessage: 'Click here to access classroom',
    description: 'Label for joining classroom in instructor dashboard.',
    id: 'component.DashboardClassroomStudent.joinClassroomLabel',
  },
  classroomEnded: {
    defaultMessage: 'Classroom ended.',
    description: 'Message when classroom has ended.',
    id: 'component.DashboardClassroomStudent.classroomEnded',
  },
  classroomNotStarted: {
    defaultMessage: 'Classroom not started yet.',
    description: 'Message when classroom is not started.',
    id: 'component.DashboardClassroomStudent.classroomNotStarted',
  },
  classroomStarted: {
    defaultMessage: 'Classroom is started.',
    description: 'Message when classroom is started.',
    id: 'component.DashboardClassroomStudent.classroomStarted',
  },
});

interface DashboardClassroomStudentProps {
  classroom: Classroom;
  joinedAs: string | false;
  joinClassroomAction: () => void;
  classroomEnded: () => void;
}

const DashboardClassroomStudent = ({
  classroom,
  joinedAs,
  joinClassroomAction,
  classroomEnded,
}: DashboardClassroomStudentProps) => {
  const intl = useIntl();

  Settings.defaultLocale = intl.locale;

  const startingAt = DateTime.fromISO(classroom.starting_at || '');
  const displayedStartingAt = startingAt.toLocaleString(DateTime.DATE_HUGE);
  const displayedStartingTime = startingAt.toLocaleString(
    DateTime.TIME_24_SIMPLE,
  );

  let displayedEventTime = `${displayedStartingAt} - ${displayedStartingTime}`;

  if (classroom.estimated_duration) {
    const estimatedDuration = Duration.fromISOTime(
      classroom.estimated_duration,
    );
    const displayedEndingAt = startingAt
      .plus(estimatedDuration)
      .toLocaleString(DateTime.TIME_24_SIMPLE);
    displayedEventTime += ` > ${displayedEndingAt}`;
  }

  useEffect(() => {
    if (classroom.ended) {
      classroomEnded();
    }
  }, [classroom]);

  let left: JSX.Element;
  let right: Nullable<JSX.Element> = null;
  if (joinedAs) {
    // classroom started and joined
    left = (
      <DashboardClassroomMessage
        message={intl.formatMessage(messages.joinedAs, { joinedAs })}
      />
    );
  } else if (classroom.started) {
    // classroom started
    left = (
      <DashboardClassroomMessage
        message={intl.formatMessage(messages.classroomStarted)}
      />
    );
    right = (
      <Button
        label={intl.formatMessage(messages.joinClassroomLabel)}
        onClick={joinClassroomAction}
        primary
        size="large"
        fill="horizontal"
      />
    );
  } else if (classroom.ended) {
    // classroom ended
    left = (
      <DashboardClassroomMessage
        message={intl.formatMessage(messages.classroomEnded)}
      />
    );
  } else if (classroom.starting_at) {
    // classroom scheduled
    left = (
      <React.Fragment>
        <Text
          size="large"
          weight="bold"
          color="blue-active"
          textAlign="center"
          margin={{ top: 'large' }}
        >
          {classroom.title}
        </Text>
        <Text color="blue-active" textAlign="center">
          {classroom.description}
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
        <DashboardClassroomStudentCounter classroom={classroom} />
      </React.Fragment>
    );
  } else {
    // classroom exists but not started
    left = (
      <DashboardClassroomMessage
        message={intl.formatMessage(messages.classroomNotStarted)}
      />
    );
  }

  return <DashboardClassroomLayout left={left} right={right} />;
};

export default DashboardClassroomStudent;
