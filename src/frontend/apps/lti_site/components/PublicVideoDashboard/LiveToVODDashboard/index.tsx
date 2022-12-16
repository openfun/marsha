import React, { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useQueryClient } from 'react-query';
import { Box } from 'grommet';

import { ConverseInitializer } from 'components/ConverseInitializer';
import { LiveVideoPanel } from 'components/LiveVideoPanel';
import { VideoLayout } from 'components/VideoLayout/VideoLayout';
import VideoPlayer from 'components/VideoPlayer';
import { useLiveSessionsQuery } from 'data/queries';
import { pushAttendance } from 'data/sideEffects/pushAttendance';
import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import { useLiveSession } from 'data/stores/useLiveSession';
import { initVideoWebsocket } from 'data/websocket';
import { TimedText, Video } from 'lib-components';

import { getOrInitAnonymousId } from 'utils/getOrInitAnonymousId';

interface LiveToVODDashboardProps {
  video: Video;
  playerType: string;
  timedTextTracks: TimedText[];
}

export const LiveToVODDashboard = ({
  video,
  playerType,
  timedTextTracks,
}: LiveToVODDashboardProps) => {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const anonymousId = useMemo(() => getOrInitAnonymousId(), []);
  const setLiveSession = useLiveSession((state) => state.setLiveSession);
  const [showPanelTrigger, setShowPanelTrigger] = useState(true);
  const { configPanel, currentItem, setPanelVisibility } = useLivePanelState(
    (state) => ({
      configPanel: state.setAvailableItems,
      currentItem: state.currentItem,
      setPanelVisibility: state.setPanelVisibility,
    }),
  );

  useLiveSessionsQuery(
    { anonymous_id: anonymousId },
    {
      onSuccess: async (data) => {
        if (data.count > 0) {
          setLiveSession(data.results[0]);
        } else {
          setLiveSession(await pushAttendance({}, intl.locale, anonymousId));
          queryClient.invalidateQueries('livesessions', {
            refetchActive: false,
          });
        }
        initVideoWebsocket(video);
      },
      refetchInterval: false,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
      staleTime: 1000,
    },
  );

  useEffect(() => {
    // if the xmpp object is not null, panel state is filled
    if (video.xmpp !== null) {
      const items = [];
      if (video.has_chat) {
        items.push(LivePanelItem.CHAT);
      }
      configPanel(items, LivePanelItem.CHAT);
    }
    // if the xmpp object becomes unavailable, panel is uninitialized (but selected tab stays unchanged)
    else {
      configPanel([]);
    }
  }, [video.xmpp, video.has_chat, configPanel]);

  // On mount and video loaded, open the livePanel by default
  useEffect(() => {
    if (video.xmpp && currentItem && showPanelTrigger) {
      setPanelVisibility(true);
      setShowPanelTrigger(false);
    }
  }, [video.xmpp, currentItem, showPanelTrigger, setPanelVisibility]);

  return (
    <ConverseInitializer>
      <VideoLayout
        isLive={false}
        actionsElement={<Box></Box>}
        displayActionsElement={false}
        isXmppReady={!!video.xmpp}
        mainElement={
          <VideoPlayer
            video={video}
            playerType={playerType}
            timedTextTracks={timedTextTracks}
          />
        }
        sideElement={<LiveVideoPanel isLive={false} />}
      ></VideoLayout>
    </ConverseInitializer>
  );
};
