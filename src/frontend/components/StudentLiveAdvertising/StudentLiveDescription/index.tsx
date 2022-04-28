import { Heading, Paragraph, Box } from 'grommet';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { normalizeColor } from 'grommet/utils';
import { Video } from 'types/tracks';
import { theme } from 'utils/theme/theme';

const messages = defineMessages({
  noTitle: {
    defaultMessage: 'This live has no title yet.',
    description: 'Title to advertise a live which has no title set yet.',
    id: 'component.StudentLiveAdvertising.StudentLiveDescription.noTitle',
  },
});

interface StudentLiveDescriptionProps {
  video: Video;
}

export const StudentLiveDescription = ({
  video,
}: StudentLiveDescriptionProps) => {
  const intl = useIntl();

  return (
    <Box margin={{ top: 'small' }}>
      <Heading
        a11yTitle={video.title || undefined}
        alignSelf="center"
        color={normalizeColor('blue-active', theme)}
        level={2}
        textAlign="center"
        size="small"
        style={{ fontStyle: video.title ? undefined : 'italic' }}
      >
        {video.title || intl.formatMessage(messages.noTitle)}
      </Heading>
      {video.description && (
        <Paragraph
          alignSelf="center"
          color={normalizeColor('blue-active', theme)}
          margin={{ left: 'large', right: 'large' }}
          textAlign="center"
        >
          {video.description}
        </Paragraph>
      )}
    </Box>
  );
};
