import { Box, Paragraph, Stack, Text } from 'grommet';
import { Schedule } from 'grommet-icons';
import {
  useAppConfig,
  liveState,
  ThumbnailDisplayer,
  useResponsive,
} from 'lib-components';
import { DateTime, Duration } from 'luxon';
import React, { CSSProperties, useEffect, useMemo, useState } from 'react';
import ICalendarLink from 'react-icalendar-link';
import { useIntl, defineMessages } from 'react-intl';
import styled from 'styled-components';

import { useCurrentLive } from '@lib-video/hooks/useCurrentVideo';

import { AdvertisingBox } from './AdvertisingBox';
import { StudentLiveDescription } from './StudentLiveDescription';
import { StudentLiveRegistration } from './StudentLiveRegistration';
import { StudentLiveScheduleInfo } from './StudentLiveScheduleInfo';

const StyledText = styled(Text)`
  padding-left: 10px;
  vertical-align: bottom;
`;

const messages = defineMessages({
  a11AddCalendar: {
    defaultMessage: 'Click to add the event to your calendar',
    description: 'Title on icon to click to add the event to my calendar',
    id: 'component.StudentLiveAdvertising.StudentLiveDescription.a11AddCalendar',
  },
  addCalendar: {
    defaultMessage: 'Add to my calendar',
    description: 'Title of the link to add this event to my calendar',
    id: 'component.StudentLiveAdvertising.StudentLiveDescription.addCalendar',
  },
  defaultTitle: {
    defaultMessage: "Don't miss the live!",
    description:
      'Title to advertise a live in a ics file which has no title set yet.',
    id: 'component.StudentLiveAdvertising.StudentLiveAdvertising.defaultTitle',
  },
  defaultDescription: {
    defaultMessage: 'Come and join us!',
    description:
      'Description to advertise a live in a ics file which has no description set yet.',
    id: 'component.StudentLiveAdvertising.StudentLiveAdvertising.defaultDescription',
  },
});

export const StudentLiveAdvertising = () => {
  const appData = useAppConfig();
  const live = useCurrentLive();
  const { isMobile } = useResponsive();
  const intl = useIntl();
  const liveScheduleStartDate = useMemo(() => {
    if (!live.starting_at) {
      return undefined;
    }
    return DateTime.fromISO(live.starting_at).setLocale(intl.locale);
  }, [live, intl]);
  const [isWaitingOver, setIsWaitingOver] = useState(
    (live.live_state &&
      [liveState.STARTING, liveState.RUNNING].includes(live.live_state)) ||
      //  scheduled live never started with an expirted schedule start date
      (!!liveScheduleStartDate &&
        live.live_state === liveState.IDLE &&
        liveScheduleStartDate < DateTime.now()),
  );

  const scheduledEvent = useMemo(() => {
    if (liveScheduleStartDate && live.starting_at) {
      const url = live.is_public
        ? `${window.location.origin}/videos/${live.id}`
        : '';
      const startDate = DateTime.fromISO(live.starting_at);
      const duration = live.estimated_duration
        ? Duration.fromISOTime(live.estimated_duration)
        : { hours: 1 };
      const endDate = startDate.plus(duration);
      return {
        description:
          live.description || intl.formatMessage(messages.defaultDescription),
        endTime: endDate.toISO(),
        startTime: startDate.toISO(),
        title: live.title || intl.formatMessage(messages.defaultTitle),
        url,
      };
    }
    return undefined;
  }, [live, liveScheduleStartDate, intl]);

  const isScheduledPassed =
    (liveScheduleStartDate && liveScheduleStartDate < DateTime.now()) ||
    !liveScheduleStartDate;

  useEffect(() => {
    if (
      live.live_state &&
      [liveState.STARTING, liveState.RUNNING].includes(live.live_state)
    ) {
      setIsWaitingOver(true);
    }
  }, [live]);

  const urlsToDisplay =
    live.thumbnail && live.thumbnail.urls
      ? live.thumbnail.urls
      : { 1080: appData.static.img.liveBackground };

  let containerStyle: CSSProperties;
  if (isMobile) {
    containerStyle = { width: '90%', maxWidth: '400px' };
  } else {
    containerStyle = { maxWidth: '40%', minWidth: '600px' };
  }
  return (
    <Stack guidingChild="last">
      <Box width="100%" height="100%">
        <ThumbnailDisplayer fitted urlsThumbnail={urlsToDisplay} />
      </Box>

      <Box
        margin="auto"
        pad={{ horizontal: 'none', vertical: 'large' }}
        style={containerStyle}
      >
        <AdvertisingBox
          margin={{ bottom: 'small', horizontal: 'auto', top: 'none' }}
          pad="large"
        >
          <StudentLiveScheduleInfo
            isTimeOver={isWaitingOver}
            setTimeIsOver={() => setIsWaitingOver(true)}
            startDate={liveScheduleStartDate}
            live_state={live.live_state}
          />
          <StudentLiveDescription startDate={liveScheduleStartDate} />
          {scheduledEvent && !isScheduledPassed && (
            <Paragraph alignSelf="center" textAlign="justify">
              <ICalendarLink event={scheduledEvent}>
                <Schedule
                  a11yTitle={intl.formatMessage(messages.a11AddCalendar)}
                  color="blue-active"
                />
                <StyledText color="blue-active">
                  {intl.formatMessage(messages.addCalendar)}
                </StyledText>
              </ICalendarLink>
            </Paragraph>
          )}
        </AdvertisingBox>

        {liveScheduleStartDate && !isWaitingOver && <StudentLiveRegistration />}
      </Box>
    </Stack>
  );
};
