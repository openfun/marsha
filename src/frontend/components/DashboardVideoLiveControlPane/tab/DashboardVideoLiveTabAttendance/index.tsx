import { Box, Spinner } from 'grommet';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { DashboardVideoLiveTabAttendanceSession } from './DashboardVideoLiveTabAttendanceSession';
import { DashboardVideoLiveTabAttendanceWaiting } from './DashboardVideoLiveTabAttendanceWaiting';

import { ErrorMessage } from 'components/ErrorComponents';
import { useLiveAttendances } from 'data/queries';
import { useCurrentVideo } from 'data/stores/useCurrentRessource/useCurrentVideo';
import { POLL_FOR_ATTENDANCES } from 'default/sideEffects';
import { liveState } from 'types/tracks';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading attendances...',
    description:
      'Accessible message for the spinner while loading the attendances.',
    id: 'components.DashboardVideoLiveControlPane.tab.DashboardVideoLivettendance.loading',
  },
});

export const DashboardVideoLiveTabAttendance = () => {
  const video = useCurrentVideo();

  if (!video.live_state || video.live_state === liveState.IDLE) {
    return <DashboardVideoLiveTabAttendanceWaiting />;
  }

  const refetchInterval =
    video.live_state &&
    [liveState.STOPPING, liveState.RUNNING].includes(video.live_state)
      ? POLL_FOR_ATTENDANCES
      : false;

  // only if the video is running or is stopping, we refresh the list
  const { data, status } = useLiveAttendances({
    refetchInterval,
    refetchIntervalInBackground: !!refetchInterval,
    refetchOnWindowFocus: !!refetchInterval,
  });

  switch (status) {
    case 'idle':
    case 'loading':
      return (
        <Box width="full">
          <Spinner size="large">
            <FormattedMessage {...messages.loading} />
          </Spinner>
        </Box>
      );
    case 'error':
      return (
        <Box width="full">
          <ErrorMessage code="generic" />
        </Box>
      );

    case 'success':
      return (
        <Box width="full">
          {data.count > 0 && (
            <Box
              background="white"
              direction="column"
              margin={{ top: 'small' }}
              pad={{ top: 'medium' }}
              round="6px"
              style={{
                boxShadow: '0px 0px 6px 0px rgba(2, 117, 180, 0.3)',
                minHeight: '70px',
              }}
            >
              {data.results.map((liveSession) => (
                <DashboardVideoLiveTabAttendanceSession
                  key={liveSession.id}
                  liveSession={liveSession}
                />
              ))}
            </Box>
          )}
          {data.count === 0 && <DashboardVideoLiveTabAttendanceWaiting />}
        </Box>
      );
  }
};
