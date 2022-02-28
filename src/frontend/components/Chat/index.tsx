import { Box, BoxExtendedProps } from 'grommet';
import React, { useEffect } from 'react';

import { getDecodedJwt } from 'data/appData';
import { useLiveRegistration } from 'data/stores/useLiveRegistration';
import { useVideo } from 'data/stores/useVideo';
import { liveState, Video } from 'types/tracks';
import { converseMounter } from 'utils/conversejs/converse';
import { StudentChat } from './StudentChat';
interface ChatProps {
  video: Video;
  standalone?: boolean;
}

const initConverse = converseMounter();

export const Chat = ({ video: baseVideo, standalone }: ChatProps) => {
  const video = useVideo((state) => state.getVideo(baseVideo));
  const liveRegistration = useLiveRegistration(
    (state) => state.liveRegistration,
  );

  useEffect(() => {
    const isAdmin = getDecodedJwt().permissions.can_access_dashboard;
    if (
      !isAdmin &&
      liveRegistration &&
      video.live_state &&
      video.live_state !== liveState.IDLE
    ) {
      initConverse(video.xmpp!, liveRegistration.display_name);
    }

    if (isAdmin && video.live_state && video.live_state !== liveState.IDLE) {
      initConverse(video.xmpp!);
    }
  }, [video, liveRegistration]);

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
          <StudentChat />
        </div>
      ) : (
        <StudentChat />
      )}
    </Box>
  );
};
