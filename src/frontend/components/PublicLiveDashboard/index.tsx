import React, { useState } from 'react';
import { useIntl } from 'react-intl';

import { ConverseInitializer } from 'components/ConverseInitializer';
import { Loader } from 'components/Loader';
import { StudentLiveAdvertising } from 'components/StudentLiveAdvertising';
import { initVideoWebsocket } from 'data/websocket';
import { Live } from 'types/tracks';
import { initWebinarContext } from 'utils/initWebinarContext';
import { useAsyncEffect } from 'utils/useAsyncEffect';

import { StudentLiveStarter } from './StudentLiveStarter';

interface PublicLiveDashboardProps {
  live: Live;
  playerType: string;
}

export const PublicLiveDashboard = ({
  live,
  playerType,
}: PublicLiveDashboardProps) => {
  const intl = useIntl();
  const [isReadyLive, setIsReadyLive] = useState(false);

  useAsyncEffect(async () => {
    if (!isReadyLive) {
      await initWebinarContext(live, intl.locale);
      initVideoWebsocket(live);
      setIsReadyLive(true);
    }
  }, [isReadyLive, live]);

  if (!isReadyLive) {
    //  live context is not ready yet,
    //  wait for websocket and session to be initialized
    return <Loader />;
  }
  if (live.xmpp) {
    return (
      <ConverseInitializer video={live}>
        <StudentLiveStarter live={live} playerType={playerType} />
      </ConverseInitializer>
    );
  } else {
    return <StudentLiveAdvertising video={live} />;
  }
};
