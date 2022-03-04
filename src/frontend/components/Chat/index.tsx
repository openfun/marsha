import { Box, BoxExtendedProps } from 'grommet';
import React, { useEffect } from 'react';

import { getDecodedJwt } from 'data/appData';
import { useLiveSession } from 'data/stores/useLiveSession';
import { useVideo } from 'data/stores/useVideo';
import { liveState, Video } from 'types/tracks';
import { converseMounter } from 'utils/conversejs/converse';
import { ChatLayout } from './ChatLayout';
interface ChatProps {
  video: Video;
  standalone?: boolean;
}

const initConverse = converseMounter();

export const Chat = ({ video: baseVideo, standalone }: ChatProps) => {
  const video = useVideo((state) => state.getVideo(baseVideo));
  const liveSession = useLiveSession((state) => state.liveSession);

  useEffect(() => {
    const isAdmin = getDecodedJwt().permissions.can_access_dashboard;
    if (
      !isAdmin &&
      liveSession &&
      video.live_state &&
      video.live_state !== liveState.IDLE
    ) {
      initConverse(video.xmpp!, liveSession.display_name);
    }

    if (isAdmin && video.live_state && video.live_state !== liveState.IDLE) {
      initConverse(video.xmpp!);
    }
  }, [video, liveSession]);

  const conditionalProps: Partial<BoxExtendedProps> = {};
  if (standalone) {
    conditionalProps.height = 'large';
  } else {
    conditionalProps.fill = true;
  }

  return (
    <Box {...conditionalProps}>
      {!!standalone ? (
        <div>
          <ChatLayout />
        </div>
      ) : (
        <ChatLayout />
      )}
    </Box>
  );
};
