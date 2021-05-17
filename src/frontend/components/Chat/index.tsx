import { Box } from 'grommet';
import React, { useEffect } from 'react';

import { useVideo } from '../../data/stores/useVideo';
import { Video } from '../../types/tracks';
import { converseMounter } from '../../utils/converse';

interface ChatProps {
  video: Video;
}

const converseManager = converseMounter();

export const Chat = ({ video: baseVideo }: ChatProps) => {
  const video = useVideo((state) => state.getVideo(baseVideo));

  useEffect(() => {
    converseManager('#converse-container', video.xmpp!);
  }, []);

  return (
    <Box
      align="start"
      direction="row"
      height="large"
      pad={{ top: 'small' }}
      id="converse-container"
    />
  );
};
