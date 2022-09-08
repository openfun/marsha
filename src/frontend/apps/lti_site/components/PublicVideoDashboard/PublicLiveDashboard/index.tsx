import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useQueryClient } from '@tanstack/react-query';

import { ConverseInitializer } from 'components/ConverseInitializer';
import { Loader } from 'components/Loader';
import { StudentLiveAdvertising } from 'components/StudentLiveAdvertising';
import { StudentLiveError } from 'components/StudentLiveError';
import { useLiveSessionsQuery } from 'data/queries';
import { pushAttendance } from 'data/sideEffects/pushAttendance';
import { useCurrentLive } from 'data/stores/useCurrentRessource/useCurrentVideo';
import { useLiveSession } from 'data/stores/useLiveSession';
import { initVideoWebsocket } from 'data/websocket';
import { getOrInitAnonymousId } from 'utils/getOrInitAnonymousId';

import { StudentLiveStarter } from './StudentLiveStarter';

interface PublicLiveDashboardProps {
  playerType: string;
}

export const PublicLiveDashboard = ({
  playerType,
}: PublicLiveDashboardProps) => {
  const live = useCurrentLive();
  const intl = useIntl();
  const anonymousId = useMemo(() => getOrInitAnonymousId(), []);
  const queryClient = useQueryClient();
  const setLiveSession = useLiveSession((state) => state.setLiveSession);
  const { isError, isLoading } = useLiveSessionsQuery(
    { anonymous_id: anonymousId },
    {
      onSuccess: async (data) => {
        if (data.count > 0) {
          setLiveSession(data.results[0]);
        } else {
          setLiveSession(await pushAttendance({}, intl.locale, anonymousId));
          queryClient.invalidateQueries(['livesessions'], {
            refetchType: 'none',
          });
        }
        initVideoWebsocket(live);
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

  if (live.xmpp) {
    return (
      <ConverseInitializer>
        <StudentLiveStarter playerType={playerType} />
      </ConverseInitializer>
    );
  } else {
    return <StudentLiveAdvertising />;
  }
};
