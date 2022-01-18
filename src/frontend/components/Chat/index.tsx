import { Box, BoxExtendedProps } from 'grommet';
import React, { useEffect } from 'react';

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

  useEffect(() => {
    if (video.live_state && video.live_state !== liveState.IDLE) {
      initConverse(video.xmpp!);
    }
  }, [video.live_state]);

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
          Instructor Chat
          <StudentChat />
        </div>
      ) : (
        <StudentChat />
      )}
    </Box>
  );
};
