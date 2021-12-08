import { Box, BoxExtendedProps } from 'grommet';
import React, { useEffect } from 'react';

import { useVideo } from 'data/stores/useVideo';
import { Video } from 'types/tracks';
import { converseMounter } from 'utils/conversejs/converse';

interface ChatProps {
  video: Video;
  standalone?: boolean;
}

const converseManager = converseMounter();

export const Chat = ({ video: baseVideo, standalone }: ChatProps) => {
  const video = useVideo((state) => state.getVideo(baseVideo));

  useEffect(() => {
    converseManager('#converse-container', video.xmpp!);
  }, []);

  const conditionalProps: Partial<BoxExtendedProps> = {};
  if (standalone) {
    conditionalProps.height = 'large';
  } else {
    conditionalProps.fill = true;
  }

  return (
    <Box
      align="start"
      direction="row"
      id="converse-container"
      {...conditionalProps}
    />
  );
};
