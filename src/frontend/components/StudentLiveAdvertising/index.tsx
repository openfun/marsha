import { Box, Paragraph, ResponsiveContext, Stack, Text } from 'grommet';
import { Schedule } from 'grommet-icons';
import { DateTime, Duration } from 'luxon';
import React, {
  CSSProperties,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import ICalendarLink from 'react-icalendar-link';
import { useIntl, defineMessages } from 'react-intl';

import { ThumbnailDisplayer } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetThumbnail/ThumbnailDisplayer';
import { appData } from 'data/appData';
import { liveState, Video } from 'types/tracks';
import { AdvertisingBox } from './AdvertisingBox';
import { StudentLiveDescription } from './StudentLiveDescription';
import { StudentLiveRegistration } from './StudentLiveRegistration';
import { StudentLiveScheduleInfo } from './StudentLiveScheduleInfo';
import styled from 'styled-components';

const StyledText = styled(Text)`
  padding-left: 10px;
  vertical-align: bottom;
`;

interface StudentLiveAdvertisingProps {
  video: Video;
}
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
export const StudentLiveAdvertising = ({
  video,
}: StudentLiveAdvertisingProps) => {
  const size = useContext(ResponsiveContext);
  const intl = useIntl();
  const liveScheduleStartDate = useMemo(() => {
    if (!video.starting_at) {
      return undefined;
    }
    return DateTime.fromISO(video.starting_at).setLocale(intl.locale);
  }, [video, intl]);
  const [isWaitingOver, setIsWaitingOver] = useState(
    (video.live_state &&
      [liveState.STARTING, liveState.RUNNING].includes(video.live_state)) ||
      //  scheduled live never started with an expirted schedule start date
      (!!liveScheduleStartDate &&
        video.live_state === liveState.IDLE &&
        liveScheduleStartDate < DateTime.now()),
  );

  const scheduledEvent = useMemo(() => {
    if (liveScheduleStartDate && video.starting_at) {
      const url = video.is_public
        ? `${window.location.origin}/videos/${video.id}`
        : '';
      const startDate = DateTime.fromISO(video.starting_at);
      const duration = video.estimated_duration
        ? Duration.fromISOTime(video.estimated_duration)
        : { hours: 1 };
      const endDate = startDate.plus(duration);
      return {
        description:
          video.description || intl.formatMessage(messages.defaultDescription),
        endTime: endDate.toISO(),
        startTime: startDate.toISO(),
        title: video.title || intl.formatMessage(messages.defaultTitle),
        url,
      };
    }
    return undefined;
  }, [video, liveScheduleStartDate, intl]);

  useEffect(() => {
    if (
      video.live_state &&
      [liveState.STARTING, liveState.RUNNING].includes(video.live_state)
    ) {
      setIsWaitingOver(true);
    }
  }, [video]);

  const urlsToDisplay =
    video.thumbnail && video.thumbnail.urls
      ? video.thumbnail.urls
      : { 1080: appData.static.img.liveBackground };

  let containerStyle: CSSProperties;
  if (size === 'small') {
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
          />
          <StudentLiveDescription video={video} />
          {scheduledEvent && (
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
