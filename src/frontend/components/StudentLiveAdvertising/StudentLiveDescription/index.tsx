import { Heading, Paragraph, Box } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useCurrentLive } from 'data/stores/useCurrentRessource/useCurrentVideo';
import { theme } from 'utils/theme/theme';

const messages = defineMessages({
  noTitle: {
    defaultMessage: 'This live has no title yet.',
    description: 'Title to advertise a live which has no title set yet.',
    id: 'component.StudentLiveAdvertising.StudentLiveDescription.noTitle',
  },
});

export const StudentLiveDescription = () => {
  const intl = useIntl();
  const live = useCurrentLive();

  return (
    <Box margin={{ top: 'small' }}>
      <Heading
        a11yTitle={live.title || undefined}
        alignSelf="center"
        color={normalizeColor('blue-active', theme)}
        level={2}
        textAlign="center"
        size="small"
        style={{ fontStyle: live.title ? undefined : 'italic' }}
      >
        {live.title || intl.formatMessage(messages.noTitle)}
      </Heading>
      {live.description && (
        <Paragraph
          alignSelf="center"
          color={normalizeColor('blue-active', theme)}
          margin={{ left: 'large', right: 'large' }}
          textAlign="center"
        >
          {live.description}
        </Paragraph>
      )}
    </Box>
  );
};
