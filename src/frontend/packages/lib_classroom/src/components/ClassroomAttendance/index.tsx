import { Accordion, AccordionPanel } from 'grommet';
import { StatusGoodSmall } from 'grommet-icons';
import { colorsTokens } from 'lib-common';
import {
  Box,
  Classroom,
  Heading,
  TabAttendanceWaiting,
  Text,
} from 'lib-components';
import { DateTime, Duration } from 'luxon';
import { useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

const StyledAccordion = styled(Accordion)`
  & h4 {
    margin-block: 0.5rem;
    color: ${colorsTokens['primary-500']};
    max-width: initial;
  }
  & > div {
    margin-block: 0.5rem;
  }
  & div[role='region'] {
    border: none;
  }
`;

const messages = defineMessages({
  dotWasPresent: {
    defaultMessage: 'Present',
    description: 'Dot icon showing this slice of time the user was connected',
    id: 'components.ClassroomAttendance.dotWasPresent',
  },
  dotMissed: {
    defaultMessage: 'Missed',
    description:
      'Title on dot icon showing this slice of time the user was not connected',
    id: 'components.ClassroomAttendance.dotMissed',
  },
  durationLabel: {
    defaultMessage: 'Duration',
    Description:
      'Label for the duration of the session, displayed after the date',
    id: 'components.ClassroomAttendance.durationLabel',
  },
});

const ClassroomAttendance = ({ sessions }: Pick<Classroom, 'sessions'>) => {
  const intl = useIntl();
  const [activeIndex, setActiveIndex] = useState([0]);

  const sessionsFormatted = useMemo(() => {
    const sessionsFormatted: {
      attendees: {
        id: string;
        fullname: string;
        percentPresence: number;
        segmentsPresence: boolean[];
      }[];
      humanDate: JSX.Element;
    }[] = [];

    sessions.forEach((session) => {
      const tsStarted = Date.parse(session.started_at);
      const tsEnded = Date.parse(session.ended_at);
      const totalDuration = tsEnded - tsStarted;

      // Split the session in 20 segments
      const segment = totalDuration / 20;
      const segments: number[] = [];
      for (let i = 1; i <= 20; i++) {
        segments.push(tsStarted + segment * i);
      }

      // Format the date locally
      const duration = Duration.fromMillis(totalDuration).toFormat('hh:mm');
      const date = DateTime.fromISO(session.started_at).setLocale(intl.locale);

      const humanDate = (
        <Box
          direction="row"
          align="center"
          role="rowheader"
          style={{ flexFlow: 'wrap' }}
        >
          <Heading level={4} margin="none" flex="grow">
            {date.toLocaleString(DateTime.DATETIME_MED)}
          </Heading>
          <Box direction="row">
            <Text margin={{ horizontal: 'xsmall' }}>-</Text>
            <Text fontStyle="italic">
              {intl.formatMessage(messages.durationLabel)}: {duration}
            </Text>
          </Box>
        </Box>
      );

      /**
       * For each attendee:
       * - calculate the presence in percentage
       * - check if the user is present per segment
       */
      const arAttendees = Object.entries(session.attendees);
      if (!arAttendees.length) {
        return;
      }

      sessionsFormatted.push({
        attendees: arAttendees.map(([key, attendee]) => {
          // calculate the presence in percentage
          let totalPresenceDuration = 0;
          attendee.presence.forEach((presence) => {
            const presenceDuration =
              (presence.left_at || tsEnded) - presence.entered_at;

            totalPresenceDuration += presenceDuration;
          });

          const percentPresence = Math.round(
            (totalPresenceDuration * 100) / totalDuration,
          );

          // Check if the user is present per segment
          const segmentsPresence = segments.map((segment) => {
            let isPresent = false;
            attendee.presence.forEach((presence) => {
              if (
                presence.entered_at <= segment &&
                (presence.left_at || segment) >= segment
              ) {
                isPresent = true;
              }
            });

            return isPresent;
          });

          return {
            id: key,
            fullname: attendee.fullname,
            percentPresence,
            segmentsPresence,
          };
        }),
        humanDate,
      });
    });

    sessionsFormatted.reverse();

    return sessionsFormatted;
  }, [intl, sessions]);

  if (!sessionsFormatted.length) {
    return <TabAttendanceWaiting type="classroom" />;
  }

  return (
    <StyledAccordion
      activeIndex={activeIndex}
      onActive={(activeIndexes) => setActiveIndex(activeIndexes)}
      multiple
    >
      {sessionsFormatted.map((session, index) => (
        <Box
          key={`session-${index}`}
          elevation
          background="white"
          round="xsmall"
          pad={{ vertical: 'medium', horizontal: 'medium' }}
        >
          <AccordionPanel label={session.humanDate}>
            {session.attendees.map((attendee) => (
              <Box
                role="listitem"
                data-testid={`attendee-${attendee.id}-${index}`}
                key={attendee.id}
                direction="row"
                pad={{ vertical: 'xsmall', left: 'xsmall' }}
                justify="space-between"
                align="center"
                style={{ flexFlow: 'wrap' }}
              >
                <Text weight="bold" flex="grow">
                  {attendee.fullname}
                </Text>
                <Box direction="row" gap="small" align="center">
                  <Box
                    direction="row"
                    gap="xxsmall"
                    style={{ flexWrap: 'wrap' }}
                  >
                    {attendee.segmentsPresence.map((isPresent, index) => {
                      return (
                        <StatusGoodSmall
                          a11yTitle={intl.formatMessage(
                            isPresent
                              ? messages.dotWasPresent
                              : messages.dotMissed,
                          )}
                          color={isPresent ? 'blue-active' : 'light-6'}
                          key={`present-${index}`}
                          size="small"
                        />
                      );
                    })}
                  </Box>
                  <Text
                    textAlign="center"
                    size="small"
                    pad="xsmall"
                    flex="grow"
                    weight="bold"
                  >
                    {attendee.percentPresence} %
                  </Text>
                </Box>
              </Box>
            ))}
          </AccordionPanel>
        </Box>
      ))}
    </StyledAccordion>
  );
};

export default ClassroomAttendance;
