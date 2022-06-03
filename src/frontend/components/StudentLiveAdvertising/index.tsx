import { Box, ResponsiveContext, Stack } from 'grommet';
import { DateTime } from 'luxon';
import React, {
  CSSProperties,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useIntl } from 'react-intl';

import { ThumbnailDisplayer } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetThumbnail/ThumbnailDisplayer';
import { appData } from 'data/appData';
import { liveState, Video } from 'types/tracks';
import { AdvertisingBox } from './AdvertisingBox';
import { StudentLiveDescription } from './StudentLiveDescription';
import { StudentLiveRegistration } from './StudentLiveRegistration';
import { StudentLiveScheduleInfo } from './StudentLiveScheduleInfo';

interface StudentLiveAdvertisingProps {
  video: Video;
}

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
        </AdvertisingBox>

        {liveScheduleStartDate && !isWaitingOver && <StudentLiveRegistration />}
      </Box>
    </Stack>
  );
};
