import { Heading, Paragraph, Box } from 'grommet';
import React from 'react';

import { normalizeColor } from 'grommet/utils';
import { Video } from 'types/tracks';
import { theme } from 'utils/theme/theme';

interface StudentLiveDescriptionProps {
  video: Video;
}

export const StudentLiveDescription = ({
  video,
}: StudentLiveDescriptionProps) => {
  return (
    <Box margin={{ top: 'small' }}>
      <Heading
        a11yTitle={video.title}
        alignSelf="center"
        color={normalizeColor('blue-active', theme)}
        level={2}
        size="small"
      >
        {video.title}
      </Heading>
      <Paragraph
        alignSelf="center"
        color={normalizeColor('blue-active', theme)}
        margin={{ left: 'large', right: 'large' }}
        textAlign="center"
      >
        {video.description}
      </Paragraph>
    </Box>
  );
};
