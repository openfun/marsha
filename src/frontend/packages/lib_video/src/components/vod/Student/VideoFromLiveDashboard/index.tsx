import { Box } from 'grommet';
import { TimedText, Video } from 'lib-components';
import React, { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useQueryClient } from 'react-query';

import { pushAttendance } from 'api/pushAttendance';
import { useLiveSessionsQuery } from 'api/useLiveSessions';
import { VideoLayout } from 'components/common/VideoLayout';
import { VideoPlayer } from 'components/common/VideoPlayer';
import { VideoWebSocketInitializer } from 'components/common/VideoWebSocketInitializer';
import { ConverseInitializer } from 'components/live/common/ConverseInitializer';
import { LiveVideoPanel } from 'components/live/common/LiveVideoPanel';
import { LivePanelItem, useLivePanelState } from 'hooks/useLivePanelState';
import { useLiveSession } from 'hooks/useLiveSession';
import { getOrInitAnonymousId } from 'utils/getOrInitAnonymousId';

interface VideoFromLiveDashboardProps {
  video: Video;
  socketUrl: string;
  playerType: string;
  timedTextTracks: TimedText[];
}

export const VideoFromLiveDashboard = ({
  video,
  socketUrl,
  playerType,
  timedTextTracks,
}: VideoFromLiveDashboardProps) => {
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
    video.id,
    { anonymous_id: anonymousId },
    {
      onSuccess: (data) => {
        if (data.count > 0) {
          setLiveSession(data.results[0]);
        } else {
          const generateFirstAttendance = async () => {
            setLiveSession(
              await pushAttendance(video.id, {}, intl.locale, anonymousId),
            );
            queryClient.invalidateQueries('livesessions', {
              refetchActive: false,
            });
          };
          generateFirstAttendance();
        }
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
      <VideoWebSocketInitializer videoId={video.id} url={socketUrl}>
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
        />
      </VideoWebSocketInitializer>
    </ConverseInitializer>
  );
};
