import {
  Box,
  BoxLoader,
  ErrorComponents,
  ErrorMessage,
  ShouldNotHappen,
  TabAttendanceWaiting,
  liveState,
} from 'lib-components';
import { defineMessages, useIntl } from 'react-intl';

import { useLiveAttendances } from '@lib-video/api/useLiveAttendances';
import { POLL_FOR_ATTENDANCES } from '@lib-video/conf/sideEffects';
import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';

import { DashboardLiveTabAttendanceSession } from './DashboardLiveTabAttendanceSession';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading attendances...',
    description:
      'Accessible message for the spinner while loading the attendances.',
    id: 'components.DashboardLiveControlPane.tab.DashboardLivettendance.loading',
  },
});

interface InternalProps {
  live_state: Exclude<liveState, liveState.IDLE>;
  video_id: string;
}

const Internal = ({ live_state, video_id }: InternalProps) => {
  const intl = useIntl();
  const refetchInterval = [liveState.STOPPING, liveState.RUNNING].includes(
    live_state,
  )
    ? POLL_FOR_ATTENDANCES
    : false;

  // only if the video is running or is stopping, we refresh the list
  const { data, status } = useLiveAttendances(video_id, {
    refetchInterval,
    refetchIntervalInBackground: !!refetchInterval,
    refetchOnWindowFocus: !!refetchInterval,
  });

  switch (status) {
    case 'loading':
      return (
        <BoxLoader
          boxProps={{ margin: { top: 'medium' } }}
          aria-label={intl.formatMessage(messages.loading)}
        />
      );
    case 'error':
      return (
        <Box width="full">
          <ErrorMessage code={ErrorComponents.generic} />
        </Box>
      );
    case 'success':
      return (
        <Box width="full">
          {data.count > 0 && (
            <Box
              background="white"
              margin={{ top: 'small' }}
              round="xsmall"
              elevation
              height={{
                min: '70px',
              }}
            >
              {data.results.map((liveSession) => (
                <DashboardLiveTabAttendanceSession
                  key={liveSession.id}
                  liveSession={liveSession}
                />
              ))}
            </Box>
          )}
          {data.count === 0 && <TabAttendanceWaiting type="webinar" />}
        </Box>
      );
    default:
      throw new ShouldNotHappen(status);
  }
};

export const DashboardLiveTabAttendance = () => {
  const video = useCurrentVideo();

  if (!video.live_state || video.live_state === liveState.IDLE) {
    return <TabAttendanceWaiting type="webinar" />;
  }

  return <Internal live_state={video.live_state} video_id={video.id} />;
};
