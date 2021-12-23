import { Box, BoxExtendedProps } from 'grommet';
import React, { useEffect } from 'react';

import { useVideo } from 'data/stores/useVideo';
import { Video } from 'types/tracks';
import { initConverse } from 'utils/conversejs/converse';

import { StudentChat } from './StudentChat';

interface ChatProps {
  video: Video;
  standalone?: boolean;
}

export const Chat = ({ video: baseVideo, standalone }: ChatProps) => {
  const video = useVideo((state) => state.getVideo(baseVideo));

  useEffect(() => {
    initConverse(video.xmpp!);
  }, []);

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
