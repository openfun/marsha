import { Box, BoxExtendedProps } from 'grommet';
import React, { useEffect } from 'react';
import { converseMounter } from 'utils/conversejs/converse';

import { useVideo } from '../../data/stores/useVideo';
import { Video } from '../../types/tracks';

interface ChatProps {
  video: Video;
  standalone?: boolean;
}

const converseManager = converseMounter();

export const Chat = ({ video: baseVideo, standalone }: ChatProps) => {
  const video = useVideo((state) => state.getVideo(baseVideo));

  useEffect(() => {
    converseManager(video.xmpp!);
  }, []);

  const conditionalProps: Partial<BoxExtendedProps> = {};
  if (standalone) {
    conditionalProps.height = 'large';
  } else {
    conditionalProps.fill = true;
  }

  return (
    <Box {...conditionalProps}>
      {!!standalone ? <div>Instructor Chat</div> : <div>Student Chat</div>}
    </Box>
  );
};
