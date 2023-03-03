import { CurrentLiveProvider, CurrentVideoProvider } from 'hooks';
import { Live, Loader } from 'lib-components';
import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useQueryClient } from 'react-query';

import { pushAttendance } from 'api/pushAttendance';
import { useLiveSessionsQuery } from 'api/useLiveSessions';
import { VideoWebSocketInitializer } from 'components/common/VideoWebSocketInitializer';
import { ConverseInitializer } from 'components/live/common/ConverseInitializer';
import { useLiveSession } from 'hooks/useLiveSession';
import { getOrInitAnonymousId } from 'utils/getOrInitAnonymousId';

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
            queryClient.invalidateQueries('livesessions', {
              refetchActive: false,
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
