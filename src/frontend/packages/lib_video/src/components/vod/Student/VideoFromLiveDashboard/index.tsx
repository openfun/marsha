import { useQueryClient } from '@tanstack/react-query';
import { Box, TimedText, Video } from 'lib-components';
import React, { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';

import { pushAttendance } from '@lib-video/api/pushAttendance';
import { useLiveSessionsQuery } from '@lib-video/api/useLiveSessions';
import { VideoLayout } from '@lib-video/components/common/VideoLayout';
import { VideoPlayer } from '@lib-video/components/common/VideoPlayer';
import { VideoWebSocketInitializer } from '@lib-video/components/common/VideoWebSocketInitializer';
import { ConverseInitializer } from '@lib-video/components/live/common/ConverseInitializer';
import { LiveVideoPanel } from '@lib-video/components/live/common/LiveVideoPanel';
import {
  LivePanelItem,
  useLivePanelState,
} from '@lib-video/hooks/useLivePanelState';
import { useLiveSession } from '@lib-video/hooks/useLiveSession';
import { getOrInitAnonymousId } from '@lib-video/utils/getOrInitAnonymousId';

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
            queryClient.invalidateQueries(['livesessions'], {
              refetchType: 'inactive',
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
