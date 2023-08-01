import { useQueryClient } from '@tanstack/react-query';
import { Live, Loader } from 'lib-components';
import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';

import { pushAttendance } from '@lib-video/api/pushAttendance';
import { useLiveSessionsQuery } from '@lib-video/api/useLiveSessions';
import { VideoWebSocketInitializer } from '@lib-video/components/common/VideoWebSocketInitializer';
import { ConverseInitializer } from '@lib-video/components/live/common/ConverseInitializer';
import { CurrentLiveProvider, CurrentVideoProvider } from '@lib-video/hooks';
import { useLiveSession } from '@lib-video/hooks/useLiveSession';
import { getOrInitAnonymousId } from '@lib-video/utils/getOrInitAnonymousId';

import { StudentLiveError } from './StudentLiveError';
import { StudentLiveStarter } from './StudentLiveStarter';

interface DasboardProps {
  live: Live;
  playerType: string;
  socketUrl: string;
}

export const Dashboard = ({ live, playerType, socketUrl }: DasboardProps) => {
  const intl = useIntl();
  const anonymousId = useMemo(() => getOrInitAnonymousId(), []);
  const queryClient = useQueryClient();
  const setLiveSession = useLiveSession((state) => state.setLiveSession);
  const { isError, isLoading } = useLiveSessionsQuery(
    live.id,
    { anonymous_id: anonymousId },
    {
      onSuccess: (data) => {
        const handle = async () => {
          if (data.count > 0) {
            setLiveSession(data.results[0]);
          } else {
            setLiveSession(
              await pushAttendance(live.id, {}, intl.locale, anonymousId),
            );
            queryClient.invalidateQueries(['livesessions'], {
              refetchType: 'inactive',
            });
          }
        };
        handle();
      },
      refetchInterval: false,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
      staleTime: 1000,
    },
  );

  if (isLoading) {
    //  live context is not ready yet,
    //  wait for websocket and session to be initialized
    return <Loader />;
  }

  if (isError) {
    return <StudentLiveError />;
  }

  return (
    <CurrentVideoProvider value={live}>
      <CurrentLiveProvider value={live}>
        <VideoWebSocketInitializer url={socketUrl} videoId={live.id}>
          <ConverseInitializer>
            <StudentLiveStarter playerType={playerType} />
          </ConverseInitializer>
        </VideoWebSocketInitializer>
      </CurrentLiveProvider>
    </CurrentVideoProvider>
  );
};
