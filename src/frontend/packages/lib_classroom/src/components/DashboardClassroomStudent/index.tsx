import { Box, Button, Paragraph } from 'grommet';
import { Schedule } from 'grommet-icons';
import { Nullable } from 'lib-common';
import { Classroom, Heading, Text, useResponsive } from 'lib-components';
import { DateTime, Duration, Settings } from 'luxon';
import React, { CSSProperties, Fragment, useEffect, useMemo } from 'react';
import ICalendarLink from 'react-icalendar-link';
import { defineMessages, useIntl } from 'react-intl';

import {
  DashboardClassroomLayout,
  DashboardClassroomMessage,
} from '@lib-classroom/components/DashboardClassroomLayout';
import { DashboardClassroomStudentCounter } from '@lib-classroom/components/DashboardClassroomStudentCounter';

const DashboardClassRoomTitleDescription = ({
  classroom,
}: {
  classroom: Classroom;
}) => {
  return (
    <React.Fragment>
      <Heading level={2} textAlign="center">
        {classroom.title}
      </Heading>
      <Text textAlign="center">{classroom.description}</Text>
    </React.Fragment>
  );
};

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
  a11AddCalendar: {
    defaultMessage: 'Click to add the event to your calendar',
    description: 'Title on icon to click to add the event to my calendar',
    id: 'component.DashboardClassroomStudent.a11AddCalendar',
  },
  addCalendar: {
    defaultMessage: 'Add to my calendar',
    description: 'Title of the link to add this event to my calendar',
    id: 'component.DashboardClassroomStudent.addCalendar',
  },
  defaultTitle: {
    defaultMessage: "Don't miss the classroom!",
    description:
      'Title to advertise a classroom in a ics file which has no title set yet.',
    id: 'component.DashboardClassroomStudentdefaultTitle',
  },
  defaultDescription: {
    defaultMessage: 'Come and join us!',
    description:
      'Description to advertise a classroom in a ics file which has no description set yet.',
    id: 'component.DashboardClassroomStudent.defaultDescription',
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
  const { isMobile } = useResponsive();
  Settings.defaultLocale = intl.locale;

  const startingAt = DateTime.fromISO(classroom.starting_at || '');
  const displayedStartingAt = startingAt.toLocaleString(DateTime.DATE_HUGE);
  const displayedStartingTime = startingAt.toLocaleString(
    DateTime.TIME_24_SIMPLE,
  );

  const isScheduledPassed = useMemo(() => {
    if (!classroom.starting_at) {
      return undefined;
    }
    const classroomScheduleStartDate = DateTime.fromISO(
      classroom.starting_at,
    ).setLocale(intl.locale);

    return (
      (classroomScheduleStartDate &&
        classroomScheduleStartDate < DateTime.now()) ||
      !classroomScheduleStartDate
    );
  }, [classroom.starting_at, intl.locale]);

  let displayedEventTime = `${displayedStartingAt} - ${displayedStartingTime}`;

  const scheduledEvent = useMemo(() => {
    if (classroom.starting_at) {
      const startDate = DateTime.fromISO(classroom.starting_at);
      const duration = classroom.estimated_duration
        ? Duration.fromISOTime(classroom.estimated_duration)
        : { hours: 1 };
      const endDate = startDate.plus(duration);
      return {
        description:
          classroom.description ||
          intl.formatMessage(messages.defaultDescription),
        endTime: endDate.toISO() as string,
        startTime: startDate.toISO() as string,
        title: classroom.title || intl.formatMessage(messages.defaultTitle),
      };
    }
    return undefined;
  }, [
    classroom.description,
    classroom.estimated_duration,
    classroom.starting_at,
    classroom.title,
    intl,
  ]);

  if (classroom.estimated_duration) {
    const estimatedDuration = Duration.fromISOTime(
      classroom.estimated_duration,
    );
    const displayedEndingAt = startingAt
      .plus(estimatedDuration)
      .toLocaleString(DateTime.TIME_24_SIMPLE);
    displayedEventTime += ` > ${displayedEndingAt}`;
  }

  let containerStyle: CSSProperties;
  if (isMobile) {
    containerStyle = { width: '90%', maxWidth: '400px' };
  } else {
    containerStyle = { maxWidth: '40%', minWidth: '600px' };
  }

  useEffect(() => {
    if (classroom.ended) {
      classroomEnded();
    }
  }, [classroom.ended, classroomEnded]);

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
      <Fragment>
        <DashboardClassRoomTitleDescription classroom={classroom} />
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
          <Text textAlign="center">{displayedEventTime}</Text>
        </Box>
        <DashboardClassroomStudentCounter starting_at={classroom.starting_at} />
        <Box
          margin="auto"
          pad={{ horizontal: 'none', vertical: 'large' }}
          style={containerStyle}
        >
          {scheduledEvent && !isScheduledPassed && (
            <Paragraph alignSelf="center" textAlign="justify">
              <ICalendarLink event={scheduledEvent}>
                <Schedule
                  a11yTitle={intl.formatMessage(messages.a11AddCalendar)}
                  color="blue-active"
                />
                <Text className="pl-s">
                  {intl.formatMessage(messages.addCalendar)}
                </Text>
              </ICalendarLink>
            </Paragraph>
          )}
        </Box>
      </Fragment>
    );
  } else {
    // classroom exists but not started
    left = (
      <React.Fragment>
        <DashboardClassRoomTitleDescription classroom={classroom} />
        <DashboardClassroomMessage
          message={intl.formatMessage(messages.classroomNotStarted)}
        />
      </React.Fragment>
    );
  }

  return <DashboardClassroomLayout left={left} right={right} />;
};

export default DashboardClassroomStudent;
